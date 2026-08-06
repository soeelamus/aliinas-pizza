import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CreditCardRounded,
  EmailRounded,
  EventRounded,
  LocalPizzaRounded,
  LocationOnRounded,
  LockRounded,
  LogoutRounded,
  PeopleRounded,
  RemoveRounded,
  SaveRounded,
} from "@mui/icons-material";

import { useParams, useSearchParams } from "react-router-dom";
import { IS_LOCAL } from "../../../utils/mockApi";
import "./ReservationPage.css";

const HARDCODED_PIN = "9080";

function getStorageKey(customerToken) {
  return `booking_pin_${customerToken}`;
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(Number(cents || 0) / 100);
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function DetailItem({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: 2,
          bgcolor: "action.hover",
          color: "primary.main",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>

        <Typography
          fontWeight={800}
          sx={{
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function ReservationPage() {
  const { customerToken } = useParams();
  const [searchParams] = useSearchParams();

  const storageKey = useMemo(
    () => getStorageKey(customerToken),
    [customerToken],
  );

  const [pin, setPin] = useState("");
  const [authenticatedPin, setAuthenticatedPin] = useState("");

  const [booking, setBooking] = useState(null);

  const [pizzas, setPizzas] = useState([]);

  const [quantities, setQuantities] = useState({});

  const [activePayment, setActivePayment] = useState(false);

  const [loading, setLoading] = useState(false);

  const [menuLoading, setMenuLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [paying, setPaying] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    const depositSuccess = searchParams.get("payment") === "success";

    if (depositSuccess && customerToken) {
      localStorage.setItem(storageKey, HARDCODED_PIN);

      setAuthenticatedPin(HARDCODED_PIN);

      setMessage("Je voorschot is betaald. Je reservatie is bevestigd.");

      return;
    }

    const storedPin = localStorage.getItem(storageKey);

    if (storedPin) {
      setAuthenticatedPin(storedPin);
    }
  }, [customerToken, searchParams, storageKey]);

  useEffect(() => {
    const paymentResult = searchParams.get("balance_payment");

    if (paymentResult === "success") {
      setMessage("Je bijbetaling werd ontvangen.");
    }

    if (paymentResult === "cancelled") {
      setError("De betaling werd geannuleerd.");
    }
  }, [searchParams]);

  const loadMenu = async () => {
    setMenuLoading(true);

    try {
      const response = await fetch(
        IS_LOCAL ? "/json/menu.json" : "/api/bookings/menu",
      );

      const result = await response.json();

      setPizzas(result.pizzas ?? []);
    } finally {
      setMenuLoading(false);
    }
  };
  const applyItems = (items = []) => {
    const next = {};

    items.forEach((item) => {
      next[item.productId] = Number(item.quantity);
    });

    setQuantities(next);
  };

  const loadBooking = async (activePin = authenticatedPin) => {
    if (!activePin || !customerToken) return;

    setLoading(true);
    setError("");

    const url = IS_LOCAL
      ? "/json/reservation.json"
      : `/api/bookings/reservation?token=${encodeURIComponent(customerToken)}`;

    try {
      const response = await fetch(url, {
        headers: {
          "x-booking-pin": activePin,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 || result.code === "INVALID_PIN") {
          localStorage.removeItem(storageKey);
          setAuthenticatedPin("");

          throw new Error("De pincode is niet correct.");
        }

        throw new Error(
          result.error || "De reservatie kon niet worden geladen.",
        );
      }

      setBooking(result.booking);
      setActivePayment(Boolean(result.activePayment));

      applyItems(result.booking.items || []);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (authenticatedPin) {
      loadBooking(authenticatedPin);
    }
  }, [authenticatedPin]);

  const selectedItems = useMemo(
    () =>
      pizzas
        .map((pizza) => ({
          ...pizza,
          quantity: Number(quantities[pizza.id] || 0),
        }))
        .filter((pizza) => pizza.quantity > 0),
    [pizzas, quantities],
  );

  const selectedPizzaCount = useMemo(
    () => selectedItems.reduce((total, pizza) => total + pizza.quantity, 0),
    [selectedItems],
  );

  const selectedPizzaSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, pizza) => total + pizza.quantity * pizza.priceCents,
        0,
      ),
    [selectedItems],
  );

  const previewOrderTotal =
    selectedPizzaSubtotal + Number(booking?.cateringFeeCents || 0);

  const previewAmountDue = Math.max(
    0,
    previewOrderTotal - Number(booking?.paidAmountCents || 0),
  );

  const handleLogin = (event) => {
    event.preventDefault();

    const cleanedPin = pin.trim();

    if (!cleanedPin) {
      setError("Vul je pincode in.");
      return;
    }

    localStorage.setItem(storageKey, cleanedPin);

    setAuthenticatedPin(cleanedPin);
    setPin("");
    setError("");
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    setAuthenticatedPin("");
    setBooking(null);
    setQuantities({});
    setMessage("");
    setError("");
  };

  const changeQuantity = (productId, difference) => {
    if (activePayment) return;

    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(0, Number(current[productId] || 0) + difference),
    }));
  };

  const handleQuantityInput = (productId, value) => {
    if (activePayment) return;

    if (value === "") {
      setQuantities((current) => ({
        ...current,
        [productId]: "",
      }));

      return;
    }

    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity < 0) {
      return;
    }

    setQuantities((current) => ({
      ...current,
      [productId]: quantity,
    }));
  };

  const saveSelection = async () => {
    if (IS_LOCAL) {
      setBooking((prev) => ({
        ...prev,
        items: selectedItems.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
        })),
      }));

      setMessage("Mock: selectie opgeslagen.");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Selecteer minstens één pizza.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/bookings/reservation?token=${encodeURIComponent(customerToken)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-booking-pin": authenticatedPin,
          },
          body: JSON.stringify({
            items: selectedItems.map((pizza) => ({
              productId: pizza.id,
              quantity: pizza.quantity,
            })),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "De pizzaselectie kon niet worden opgeslagen.",
        );
      }

      setBooking(result.booking);
      setActivePayment(false);
      applyItems(result.booking.items || []);

      setMessage("Je pizzaselectie werd opgeslagen.");
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const startPayment = async () => {
    if (IS_LOCAL) {
      setMessage("Mock betaling gestart.");
      return;
    }
    setPaying(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/create-balance-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-booking-pin": authenticatedPin,
        },
        body: JSON.stringify({
          customerToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "De betaling kon niet worden gestart.");
      }

      window.location.href = result.checkoutUrl;
    } catch (paymentError) {
      console.error(paymentError);
      setError(paymentError.message);
      setPaying(false);
    }
  };

  if (!authenticatedPin) {
    return (
      <Box className="reservation-login-page">
        <Container maxWidth="sm">
          <Paper elevation={0} className="reservation-login-card">
            <Stack component="form" onSubmit={handleLogin} spacing={3} className="reservation-login-form">
              <Box textAlign="center">
                <LockRounded color="primary" sx={{ fontSize: 54 }} />

                <Typography variant="h4" fontWeight={900}>
                  Jouw reservatie
                </Typography>

                <Typography color="text.secondary">
                  Geef je pincode in.
                </Typography>
              </Box>

              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Pincode"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                inputMode="numeric"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRounded />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button type="submit" variant="contained" size="large">
                Enter
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="reservation-page">
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
            className="reservation-header"
          >
            <Box>
              <Typography variant="h3" fontWeight={900}>
                Jouw reservatie
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<LogoutRounded />}
              onClick={handleLogout}
            >
              Afmelden
            </Button>
          </Stack>

          {activePayment && (
            <Alert severity="warning">
              Er is momenteel een betaling actief. Je selectie kan pas opnieuw
              gewijzigd worden wanneer deze betaling voltooid of verlopen is.
            </Alert>
          )}

          {loading && (
            <Paper elevation={0} className="reservation-loading-card">
              <CircularProgress />
            </Paper>
          )}

          {!loading && booking && (
            <>
              <Paper elevation={0} className="reservation-card reservation-overview-card">
                <Stack spacing={3} className="reservation-shell">
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h5" fontWeight={900}>
                      Reservatie bevestigd
                    </Typography>

                    <Chip
                      color="success"
                      icon={<CheckCircleRounded />}
                      label="Bevestigd"
                    />
                  </Stack>

                  <Divider />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                      },
                      gap: 3,
                    }}
                  >
                    <DetailItem
                      icon={<CalendarMonthRounded />}
                      label="Datum"
                      value={formatDate(booking.eventDate)}
                    />

                    <DetailItem
                      icon={<LocationOnRounded />}
                      label="Locatie"
                      value={booking.location}
                    />

                    <DetailItem
                      icon={<PeopleRounded />}
                      label="Gasten"
                      value={booking.guestCount}
                    />

                    <DetailItem
                      icon={<EmailRounded />}
                      label="E-mail"
                      value={booking.email}
                    />

                    <DetailItem
                      icon={<EventRounded />}
                      label="Voorschot betaald"
                      value={formatCurrency(booking.depositAmountCents)}
                    />
                  </Box>
                </Stack>
              </Paper>

              <Paper elevation={0} className="reservation-card reservation-cost-card">
                <Stack spacing={3}>
                  <Typography variant="h5" fontWeight={900}>
                    Vaste kosten
                  </Typography>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Cateringkost</Typography>

                    <Typography fontWeight={900}>
                      {formatCurrency(booking.cateringFeeCents)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Paper elevation={0} className="reservation-card reservation-menu-card">
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LocalPizzaRounded color="primary" />

                    <Typography variant="h5" fontWeight={900}>
                      Kies je pizza’s
                    </Typography>
                  </Stack>

                  {menuLoading ? (
                    <CircularProgress />
                  ) : (
                    pizzas.map((pizza) => {
                      const quantity = Number(quantities[pizza.id] || 0);

                      return (
                        <Paper
                          key={pizza.id}
                          variant="outlined"
                          className="reservation-pizza-row"
                        >
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
                              <Typography fontWeight={900}>
                                {pizza.name} {pizza.icon}
                              </Typography>

                              <Typography color="text.secondary">
                                {formatCurrency(pizza.priceCents)}
                              </Typography>
                            </Box>

                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <IconButton
                                onClick={() => changeQuantity(pizza.id, -1)}
                                disabled={activePayment || quantity === 0}
                              >
                                <RemoveRounded />
                              </IconButton>

                              <TextField
                                type="number"
                                value={quantities[pizza.id] ?? 0}
                                onChange={(event) =>
                                  handleQuantityInput(
                                    pizza.id,
                                    event.target.value,
                                  )
                                }
                                disabled={activePayment}
                                size="small"
                                sx={{ width: 85 }}
                              />

                              <IconButton
                                onClick={() => changeQuantity(pizza.id, 1)}
                                disabled={
                                  activePayment ||
                                  selectedPizzaCount >= booking.maxPizzas
                                }
                              >
                                <AddRounded />
                              </IconButton>

                              <Typography
                                fontWeight={900}
                                sx={{
                                  minWidth: 95,
                                  textAlign: "right",
                                }}
                              >
                                {formatCurrency(quantity * pizza.priceCents)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })
                  )}

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Pizza’s</Typography>

                    <Typography fontWeight={900}>
                      {selectedPizzaCount}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Subtotaal pizza’s</Typography>

                    <Typography fontWeight={900}>
                      {formatCurrency(selectedPizzaSubtotal)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Cateringkost</Typography>

                    <Typography fontWeight={900}>
                      {formatCurrency(booking.cateringFeeCents)}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={900}>
                      Nieuw totaal
                    </Typography>

                    <Typography variant="h5" fontWeight={900}>
                      {formatCurrency(previewOrderTotal)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Reeds betaald</Typography>

                    <Typography color="success.main" fontWeight={900}>
                      − {formatCurrency(booking.paidAmountCents)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={900}>
                      Te betalen na opslaan
                    </Typography>

                    <Typography variant="h5" fontWeight={900}>
                      {formatCurrency(previewAmountDue)}
                    </Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      saving ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveRounded />
                      )
                    }
                    onClick={saveSelection}
                    disabled={saving || activePayment || selectedPizzaCount < 1}
                  >
                    Pizzaselectie opslaan
                  </Button>
                  
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
                </Stack>
              </Paper>

              <Paper elevation={0} className="reservation-card reservation-payment-card">
                <Stack spacing={2}>
                  <Typography variant="h5" fontWeight={900}>
                    Betaling
                  </Typography>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Huidig totaal</Typography>

                    <Typography fontWeight={900}>
                      {formatCurrency(booking.orderTotalCents)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Totaal betaald</Typography>

                    <Typography color="success.main" fontWeight={900}>
                      {formatCurrency(booking.paidAmountCents)}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={900}>
                      Nog te betalen
                    </Typography>

                    <Typography variant="h5" fontWeight={900}>
                      {formatCurrency(booking.remainingAmountCents)}
                    </Typography>
                  </Stack>

                  {booking.remainingAmountCents > 0 ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={
                        paying ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <CreditCardRounded />
                        )
                      }
                      onClick={startPayment}
                      disabled={paying || activePayment}
                    >
                      Betaal {formatCurrency(booking.remainingAmountCents)}
                    </Button>
                  ) : (
                    <Alert severity="success">
                      Je huidige selectie is volledig betaald. Je kunt later nog
                      pizza’s toevoegen en alleen het verschil bijbetalen.
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}