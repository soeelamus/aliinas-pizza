import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AttachMoneyRounded,
  LocalPizzaRounded,
  PointOfSaleRounded,
  ReceiptLongRounded,
  RefreshRounded,
  ShoppingCartRounded,
  TrendingUpRounded,
} from "@mui/icons-material";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

const formatCurrency = (value) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat("nl-NL").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const getBrusselsDate = (date = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getWeekStart = () => {
  const date = new Date();
  const day = date.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);

  return getBrusselsDate(date);
};

const getMonthStart = () => {
  const date = new Date();
  date.setDate(1);

  return getBrusselsDate(date);
};

const getStatusLabel = (status) => {
  const labels = {
    new: "Nieuw",
    done: "Klaar",
    pickedup: "Afgehaald",
    cancelled: "Geannuleerd",
  };

  return labels[status] || status || "Onbekend";
};

const getStatusColor = (status) => {
  const colors = {
    new: "warning",
    done: "info",
    pickedup: "success",
    cancelled: "error",
  };

  return colors[status] || "default";
};

const getPaymentLabel = (method) => {
  const labels = {
    cash: "Cash",
    card: "Kaart",
    payconiq: "Payconiq",
    online: "Online",
  };

  return labels[method] || method || "Onbekend";
};

const getCategoryLabel = (category) => {
  const labels = {
    pizza: "Pizza",
    drink: "Drank",
    dessert: "Dessert",
    extra: "Extra",
    other: "Overig",
  };

  return labels[category] || category;
};

function KpiCard({ title, value, subtitle, icon, loading = false }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {title}
            </Typography>

            {loading ? (
              <Box sx={{ mt: 2, width: 100 }}>
                <LinearProgress />
              </Box>
            ) : (
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                {value}
              </Typography>
            )}

            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {action}
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    startDate: getWeekStart(),
    endDate: getBrusselsDate(),
    paymentMethod: "",
    weekday: "",
  });

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    if (filters.paymentMethod) {
      params.set("paymentMethod", filters.paymentMethod);
    }

    if (filters.weekday !== "") {
      params.set("weekday", filters.weekday);
    }

    return params.toString();
  }, [filters]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!dashboard) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const response = await fetch(`/api/dashboard?${queryString}`, {
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error("Dashboard-API gaf geen geldige JSON terug.");
        }

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Dashboard kon niet geladen worden.");
        }

        if (mounted) {
          setDashboard(data);
        }
      } catch (loadError) {
        console.error("Dashboard load error:", loadError);

        if (mounted) {
          setError(loadError.message || "Dashboard kon niet geladen worden.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [queryString, reloadKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const setDateRange = (range) => {
    const today = new Date();

    if (range === "today") {
      const date = getBrusselsDate(today);

      setFilters((current) => ({
        ...current,
        startDate: date,
        endDate: date,
      }));

      return;
    }

    if (range === "week") {
      setFilters((current) => ({
        ...current,
        startDate: getWeekStart(),
        endDate: getBrusselsDate(),
      }));

      return;
    }

    if (range === "month") {
      setFilters((current) => ({
        ...current,
        startDate: getMonthStart(),
        endDate: getBrusselsDate(),
      }));

      return;
    }

    const start = new Date();
    start.setDate(start.getDate() - 29);

    setFilters((current) => ({
      ...current,
      startDate: getBrusselsDate(start),
      endDate: getBrusselsDate(),
    }));
  };

  const revenueChart = useMemo(() => {
    const days = dashboard?.revenueByDay || [];

    return {
      labels: days.map((day) => formatDate(day.date)),
      revenue: days.map((day) => Number(day.revenue || 0)),
      orders: days.map((day) => Number(day.orders || 0)),
    };
  }, [dashboard]);

  const bestsellerChart = useMemo(() => {
    return (dashboard?.bestsellers || [])
      .slice(0, 8)
      .map((product) => ({
        name: product.productName,
        quantity: Number(product.quantity || 0),
      }))
      .reverse();
  }, [dashboard]);

  const paymentChart = useMemo(() => {
    return (dashboard?.paymentMethods || []).map((payment, index) => ({
      id: index,
      label: getPaymentLabel(payment.paymentMethod),
      value: Number(payment.revenue || 0),
    }));
  }, [dashboard]);

  const categoryChart = useMemo(() => {
    return (dashboard?.categorySales || [])
      .filter((category) => category.quantity > 0)
      .map((category, index) => ({
        id: index,
        label: getCategoryLabel(category.category),
        value: Number(category.quantity || 0),
      }));
  }, [dashboard]);

  if (loading && !dashboard) {
    return (
      <Box
        sx={{
          minHeight: "65vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Dashboard laden…</Typography>
        </Stack>
      </Box>
    );
  }

  const WEEKDAY_LABELS = {
    0: "zondagen",
    1: "maandagen",
    2: "dinsdagen",
    3: "woensdagen",
    4: "donderdagen",
    5: "vrijdagen",
    6: "zaterdagen",
  };

  const selectedWeekdayLabel =
    filters.weekday === ""
      ? "alle dagen"
      : WEEKDAY_LABELS[Number(filters.weekday)];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: {
          xs: 3,
          md: 5,
        },
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            spacing={2}
          >
            <Box>
              <Typography variant="h3" component="h1" fontWeight={900}>
                Dashboard
              </Typography>

              <Typography color="text.secondary">
                Verkoop, orders en prestaties van Aliina&apos;s Pizza.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {refreshing && <CircularProgress size={22} />}

              <Tooltip title="Dashboard vernieuwen">
                <IconButton
                  onClick={() => setReloadKey((current) => current + 1)}
                  disabled={refreshing}
                  color="primary"
                >
                  <RefreshRounded />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {error && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  Opnieuw
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  onClick={() => setDateRange("today")}
                >
                  Vandaag
                </Button>

                <Button variant="outlined" onClick={() => setDateRange("week")}>
                  Deze week
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setDateRange("month")}
                >
                  Deze maand
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setDateRange("30days")}
                >
                  Laatste 30 dagen
                </Button>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="Van"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  fullWidth
                />

                <TextField
                  label="Tot"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="payment-filter-label">Betaling</InputLabel>

                  <Select
                    labelId="payment-filter-label"
                    label="Betaling"
                    name="paymentMethod"
                    value={filters.paymentMethod}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Alle betalingen</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Kaart</MenuItem>
                    <MenuItem value="payconiq">Payconiq</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="weekday-filter-label">Weekdag</InputLabel>

                  <Select
                    labelId="weekday-filter-label"
                    label="Weekdag"
                    name="weekday"
                    value={filters.weekday}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Alle weekdagen</MenuItem>
                    <MenuItem value="1">Maandag</MenuItem>
                    <MenuItem value="2">Dinsdag</MenuItem>
                    <MenuItem value="3">Woensdag</MenuItem>
                    <MenuItem value="4">Donderdag</MenuItem>
                    <MenuItem value="5">Vrijdag</MenuItem>
                    <MenuItem value="6">Zaterdag</MenuItem>
                    <MenuItem value="0">Zondag</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <KpiCard
              title="Omzet"
              value={formatCurrency(dashboard?.summary?.revenue)}
              subtitle="Exclusief geannuleerde orders"
              icon={<AttachMoneyRounded />}
              loading={refreshing}
            />

            <KpiCard
              title="Orders"
              value={formatNumber(dashboard?.summary?.orderCount)}
              subtitle="Aantal bestellingen"
              icon={<ReceiptLongRounded />}
              loading={refreshing}
            />

            <KpiCard
              title="Verkochte items"
              value={formatNumber(dashboard?.summary?.itemCount)}
              subtitle="Pizza, drank en dessert"
              icon={<ShoppingCartRounded />}
              loading={refreshing}
            />

            <KpiCard
              title="Gemiddelde order"
              value={formatCurrency(dashboard?.summary?.averageOrderValue)}
              subtitle="Omzet per bestelling"
              icon={<TrendingUpRounded />}
              loading={refreshing}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "minmax(0, 2fr) minmax(320px, 1fr)",
              },
              gap: 3,
            }}
          >
            <SectionCard
              title={`Omzet — ${selectedWeekdayLabel}`}
              subtitle={
                filters.weekday === ""
                  ? "Dagelijkse omzet binnen de geselecteerde periode"
                  : `Alle ${selectedWeekdayLabel} binnen de geselecteerde periode`
              }
            >
              {revenueChart.labels.length > 0 ? (
                <LineChart
                  height={340}
                  xAxis={[
                    {
                      scaleType: "point",
                      data: revenueChart.labels,
                    },
                  ]}
                  yAxis={[
                    {
                      valueFormatter: (value) => `€${Number(value).toFixed(0)}`,
                    },
                  ]}
                  series={[
                    {
                      data: revenueChart.revenue,
                      label: "Omzet",
                      area: true,
                      curve: "monotoneX",
                      valueFormatter: (value) => formatCurrency(value),
                    },
                  ]}
                  grid={{
                    horizontal: true,
                  }}
                  margin={{
                    left: 70,
                    right: 20,
                    top: 30,
                    bottom: 40,
                  }}
                />
              ) : (
                <Alert severity="info">Geen omzetdata voor deze periode.</Alert>
              )}
            </SectionCard>

            <SectionCard
              title="Betaalmethodes"
              subtitle="Verdeling van de omzet"
            >
              {paymentChart.length > 0 ? (
                <PieChart
                  height={340}
                  series={[
                    {
                      data: paymentChart,
                      innerRadius: 60,
                      outerRadius: 110,
                      paddingAngle: 3,
                      cornerRadius: 5,
                      valueFormatter: (item) => formatCurrency(item.value),
                    },
                  ]}
                />
              ) : (
                <Alert severity="info">Geen betaaldata beschikbaar.</Alert>
              )}
            </SectionCard>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "minmax(0, 2fr) minmax(320px, 1fr)",
              },
              gap: 3,
            }}
          >
            <SectionCard
              title="Bestsellers"
              subtitle="Meest verkochte producten"
            >
              {bestsellerChart.length > 0 ? (
                <BarChart
                  height={380}
                  layout="horizontal"
                  yAxis={[
                    {
                      scaleType: "band",
                      data: bestsellerChart.map((item) => item.name),
                      width: 130,
                    },
                  ]}
                  xAxis={[
                    {
                      valueFormatter: (value) => formatNumber(value),
                    },
                  ]}
                  series={[
                    {
                      data: bestsellerChart.map((item) => item.quantity),
                      label: "Verkocht",
                      valueFormatter: (value) => `${formatNumber(value)}×`,
                    },
                  ]}
                  grid={{
                    vertical: true,
                  }}
                  margin={{
                    left: 10,
                    right: 25,
                    top: 30,
                    bottom: 30,
                  }}
                />
              ) : (
                <Alert severity="info">Geen bestsellerdata beschikbaar.</Alert>
              )}
            </SectionCard>

            <SectionCard
              title="Verkoop per categorie"
              subtitle="Aantal verkochte artikelen"
            >
              {categoryChart.length > 0 ? (
                <PieChart
                  height={380}
                  series={[
                    {
                      data: categoryChart,
                      innerRadius: 45,
                      outerRadius: 110,
                      paddingAngle: 3,
                      cornerRadius: 5,
                      arcLabel: (item) => `${item.value}`,
                      arcLabelMinAngle: 20,
                    },
                  ]}
                />
              ) : (
                <Alert severity="info">Geen categoriedata beschikbaar.</Alert>
              )}
            </SectionCard>
          </Box>

          <SectionCard
            title="Verkoop per dag"
            subtitle="Orders, items en omzet per kalenderdag"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Omzet</TableCell>
                    <TableCell align="right">Gemiddeld</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(dashboard?.revenueByDay || []).map((day) => (
                    <TableRow key={day.date} hover>
                      <TableCell>
                        <Typography fontWeight={700}>
                          {formatDate(day.date)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        {formatNumber(day.orders)}
                      </TableCell>

                      <TableCell align="right">
                        {formatNumber(day.items)}
                      </TableCell>

                      <TableCell align="right">
                        <Typography fontWeight={700}>
                          {formatCurrency(day.revenue)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        {formatCurrency(
                          Number(day.orders) > 0
                            ? Number(day.revenue) / Number(day.orders)
                            : 0,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {(dashboard?.revenueByDay || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Geen verkoopdata gevonden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard
            title="Recente orders"
            subtitle="De twintig meest recente bestellingen binnen de filters"
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Klant</TableCell>
                    <TableCell>Afhalen</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Betaling</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Totaal</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(dashboard?.recentOrders || []).map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: "primary.main",
                            }}
                          >
                            <PointOfSaleRounded fontSize="small" />
                          </Avatar>

                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {order.customer_name || "Cashier"}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {order.external_id}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {order.pickup_date || "—"}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {order.pickup_time || "ASAP"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          {(order.order_items || []).slice(0, 3).map((item) => (
                            <Typography key={item.id} variant="caption">
                              {item.quantity}× {item.product_name}
                            </Typography>
                          ))}

                          {(order.order_items || []).length > 3 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              +{(order.order_items || []).length - 3} andere
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={getPaymentLabel(order.payment_method)}
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={getStatusLabel(order.status)}
                          color={getStatusColor(order.status)}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography fontWeight={800}>
                          {formatCurrency(order.total)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {(dashboard?.recentOrders || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Geen orders gevonden.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Stack>
      </Container>
    </Box>
  );
}
