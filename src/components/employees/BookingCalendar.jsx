import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import {
  BlockRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  DeleteOutlineRounded,
  EventAvailableRounded,
  EventBusyRounded,
  LockClockRounded,
  RefreshRounded,
} from "@mui/icons-material";

const MONTH_NAMES = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

const WEEKDAY_NAMES = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function toDateString(year, monthIndex, day) {
  const date = new Date(Date.UTC(year, monthIndex, day));

  return date.toISOString().slice(0, 10);
}

function getDaysInMonth(year, monthIndex) {
  return new Date(
    Date.UTC(year, monthIndex + 1, 0),
  ).getUTCDate();
}

function getMondayBasedWeekday(date) {
  return (date.getUTCDay() + 6) % 7;
}

function getMonthQuery(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function formatSelectedDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function getDayStatusStyles(status, theme) {
  switch (status) {
    case "available":
      return {
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        borderColor: alpha(theme.palette.success.main, 0.35),
        color: theme.palette.success.dark,

        "&:hover": {
          backgroundColor: alpha(theme.palette.success.main, 0.17),
        },
      };

    case "booked":
      return {
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        borderColor: alpha(theme.palette.error.main, 0.35),
        color: theme.palette.error.dark,

        "&:hover": {
          backgroundColor: alpha(theme.palette.error.main, 0.17),
        },
      };

    case "pending":
      return {
        backgroundColor: alpha(theme.palette.warning.main, 0.12),
        borderColor: alpha(theme.palette.warning.main, 0.4),
        color: theme.palette.warning.dark,

        "&:hover": {
          backgroundColor: alpha(theme.palette.warning.main, 0.2),
        },
      };

    default:
      return {
        backgroundColor: alpha(theme.palette.text.primary, 0.025),
        borderColor: theme.palette.divider,
        color: theme.palette.text.secondary,

        "&:hover": {
          backgroundColor: alpha(theme.palette.text.primary, 0.06),
        },
      };
  }
}

const BookingCalendar = () => {
  const today = new Date();

  const [visibleDate, setVisibleDate] = useState(
    new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    ),
  );

  const [calendarData, setCalendarData] = useState({
    weekdayRules: [],
    overrides: [],
    bookings: [],
    settings: null,
  });

  const [selectedDay, setSelectedDay] = useState(null);
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const year = visibleDate.getUTCFullYear();
  const monthIndex = visibleDate.getUTCMonth();
  const monthQuery = getMonthQuery(year, monthIndex);

  const loadCalendar = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/calendar?month=${monthQuery}`,
        {
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "De kalender kon niet worden geladen.",
        );
      }

      setCalendarData({
        weekdayRules: result.weekdayRules || [],
        overrides: result.overrides || [],
        bookings: result.bookings || [],
        settings: result.settings || null,
      });
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError.message ||
          "De kalender kon niet worden geladen.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [monthQuery]);

  const weekdayRuleMap = useMemo(() => {
    return new Map(
      calendarData.weekdayRules.map((rule) => [
        Number(rule.weekday),
        Boolean(rule.is_available),
      ]),
    );
  }, [calendarData.weekdayRules]);

  const overrideMap = useMemo(() => {
    return new Map(
      calendarData.overrides.map((override) => [
        override.event_date,
        override,
      ]),
    );
  }, [calendarData.overrides]);

  const bookingMap = useMemo(() => {
    return new Map(
      calendarData.bookings.map((booking) => [
        booking.event_date,
        booking,
      ]),
    );
  }, [calendarData.bookings]);

  const calendarDays = useMemo(() => {
    const result = [];

    const firstDay = new Date(
      Date.UTC(year, monthIndex, 1),
    );

    const emptyDays = getMondayBasedWeekday(firstDay);

    for (let index = 0; index < emptyDays; index += 1) {
      result.push({
        empty: true,
        key: `empty-${index}`,
      });
    }

    const dayCount = getDaysInMonth(year, monthIndex);

    for (let day = 1; day <= dayCount; day += 1) {
      const date = toDateString(year, monthIndex, day);
      const parsedDate = new Date(`${date}T00:00:00Z`);
      const weekday = parsedDate.getUTCDay();

      const defaultAvailable =
        weekdayRuleMap.get(weekday) ?? false;

      const override = overrideMap.get(date) || null;
      const booking = bookingMap.get(date) || null;

      let status = defaultAvailable
        ? "available"
        : "unavailable";

      let statusLabel = defaultAvailable
        ? "Beschikbaar"
        : "Gesloten";

      if (override) {
        status = override.is_available
          ? "available"
          : "unavailable";

        statusLabel = override.is_available
          ? "Extra beschikbaar"
          : "Geblokkeerd";
      }

      if (booking) {
        status =
          booking.status === "confirmed"
            ? "booked"
            : "pending";

        statusLabel =
          booking.status === "confirmed"
            ? "Geboekt"
            : "Betaling bezig";
      }

      result.push({
        empty: false,
        key: date,
        date,
        day,
        status,
        statusLabel,
        defaultAvailable,
        override,
        booking,
      });
    }

    return result;
  }, [
    year,
    monthIndex,
    weekdayRuleMap,
    overrideMap,
    bookingMap,
  ]);

  const openDay = (day) => {
    if (day.empty) return;

    setSelectedDay(day);
    setReason(day.override?.reason || "");
    setError("");
  };

  const closeDialog = () => {
    if (saving) return;

    setSelectedDay(null);
    setReason("");
  };

  const saveOverride = async (isAvailable) => {
    if (!selectedDay?.date) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/calendar",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDay.date,
            isAvailable,
            reason,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "De datum kon niet worden aangepast.",
        );
      }

      await loadCalendar();
      closeDialog();
    } catch (saveError) {
      console.error(saveError);

      setError(
        saveError.message ||
          "De datum kon niet worden aangepast.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async () => {
    if (!selectedDay?.date) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/calendar",
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDay.date,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "De standaardregel kon niet worden hersteld.",
        );
      }

      await loadCalendar();
      closeDialog();
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError.message ||
          "De standaardregel kon niet worden hersteld.",
      );
    } finally {
      setSaving(false);
    }
  };

  const previousMonth = () => {
    setSelectedDay(null);

    setVisibleDate(
      new Date(Date.UTC(year, monthIndex - 1, 1)),
    );
  };

  const nextMonth = () => {
    setSelectedDay(null);

    setVisibleDate(
      new Date(Date.UTC(year, monthIndex + 1, 1)),
    );
  };

  const goToCurrentMonth = () => {
    setSelectedDay(null);

    setVisibleDate(
      new Date(
        Date.UTC(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
      ),
    );
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                <CalendarMonthRounded />
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Beschikbare eventdatums
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Beheer directe reservaties en uitzonderingen.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              <Tooltip title="Vorige maand">
                <IconButton onClick={previousMonth}>
                  <ChevronLeftRounded />
                </IconButton>
              </Tooltip>

              <Button
                variant="text"
                onClick={goToCurrentMonth}
                sx={{
                  minWidth: {
                    xs: 140,
                    sm: 170,
                  },
                  fontWeight: 800,
                  textTransform: "capitalize",
                }}
              >
                {MONTH_NAMES[monthIndex]} {year}
              </Button>

              <Tooltip title="Volgende maand">
                <IconButton onClick={nextMonth}>
                  <ChevronRightRounded />
                </IconButton>
              </Tooltip>

              <Tooltip title="Kalender vernieuwen">
                <IconButton
                  onClick={loadCalendar}
                  disabled={loading}
                  color="primary"
                >
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RefreshRounded />
                  )}
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
                  onClick={loadCalendar}
                >
                  Opnieuw
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
          >
            <Chip
              size="small"
              icon={<EventAvailableRounded />}
              label="Beschikbaar"
              color="success"
              variant="outlined"
            />

            <Chip
              size="small"
              icon={<EventBusyRounded />}
              label="Gesloten"
              variant="outlined"
            />

            <Chip
              size="small"
              icon={<LockClockRounded />}
              label="Betaling bezig"
              color="warning"
              variant="outlined"
            />

            <Chip
              size="small"
              icon={<CheckCircleRounded />}
              label="Geboekt"
              color="error"
              variant="outlined"
            />
          </Stack>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: {
                xs: 0.5,
                sm: 1,
              },
            }}
          >
            {WEEKDAY_NAMES.map((weekday) => (
              <Typography
                key={weekday}
                variant="caption"
                color="text.secondary"
                fontWeight={800}
                textAlign="center"
                sx={{
                  py: 0.5,
                }}
              >
                {weekday}
              </Typography>
            ))}

            {loading
              ? Array.from({ length: 35 }).map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      minHeight: {
                        xs: 58,
                        sm: 85,
                      },
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  />
                ))
              : calendarDays.map((day) => {
                  if (day.empty) {
                    return (
                      <Box
                        key={day.key}
                        sx={{
                          minHeight: {
                            xs: 58,
                            sm: 85,
                          },
                        }}
                      />
                    );
                  }

                  return (
                    <Button
                      key={day.key}
                      type="button"
                      onClick={() => openDay(day)}
                      sx={(theme) => ({
                        ...getDayStatusStyles(
                          day.status,
                          theme,
                        ),

                        minWidth: 0,
                        minHeight: {
                          xs: 58,
                          sm: 85,
                        },
                        p: {
                          xs: 0.5,
                          sm: 1,
                        },
                        border: "1px solid",
                        borderRadius: 2,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        textTransform: "none",
                        overflow: "hidden",
                      })}
                    >
                      <Stack
                        spacing={0.5}
                        alignItems="flex-start"
                        width="100%"
                      >
                        <Typography
                          variant="body2"
                          fontWeight={900}
                        >
                          {day.day}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            display: {
                              xs: "none",
                              sm: "block",
                            },
                            lineHeight: 1.2,
                          }}
                        >
                          {day.statusLabel}
                        </Typography>

                        {day.booking && (
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              display: {
                                xs: "none",
                                md: "block",
                              },
                              width: "100%",
                              opacity: 0.8,
                            }}
                          >
                            {day.booking.first_name}
                          </Typography>
                        )}
                      </Stack>
                    </Button>
                  );
                })}
          </Box>
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(selectedDay)}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        {selectedDay && (
          <>
            <DialogTitle>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
              >
                <CalendarMonthRounded color="primary" />

                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    {formatSelectedDate(selectedDay.date)}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {selectedDay.statusLabel}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2.5}>
                {selectedDay.booking ? (
                  <>
                    <Alert
                      severity={
                        selectedDay.booking.status === "confirmed"
                          ? "success"
                          : "warning"
                      }
                    >
                      {selectedDay.booking.status === "confirmed"
                        ? "Deze datum is definitief geboekt."
                        : "Voor deze datum is momenteel een betaling bezig."}
                    </Alert>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Klant
                        </Typography>

                        <Typography fontWeight={800}>
                          {selectedDay.booking.first_name}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          E-mail
                        </Typography>

                        <Typography fontWeight={800}>
                          {selectedDay.booking.email}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Gasten
                        </Typography>

                        <Typography fontWeight={800}>
                          {selectedDay.booking.guest_count}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Pizza’s
                        </Typography>

                        <Typography fontWeight={800}>
                          {selectedDay.booking.pizza_count}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <Alert severity="info">
                      De standaardregel voor deze weekdag is{" "}
                      <strong>
                        {selectedDay.defaultAvailable
                          ? "beschikbaar"
                          : "gesloten"}
                      </strong>
                      .
                    </Alert>

                    <TextField
                      label="Interne opmerking"
                      value={reason}
                      onChange={(event) =>
                        setReason(event.target.value)
                      }
                      placeholder="Bijvoorbeeld: privéfeest, onderhoud of extra cateringdag"
                      multiline
                      minRows={3}
                      fullWidth
                    />

                    {selectedDay.override && (
                      <Alert severity="warning">
                        Voor deze datum is momenteel een handmatige
                        uitzondering ingesteld.
                      </Alert>
                    )}
                  </>
                )}
              </Stack>
            </DialogContent>

            <DialogActions
              sx={{
                p: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Button
                onClick={closeDialog}
                disabled={saving}
              >
                Sluiten
              </Button>

              {!selectedDay.booking && (
                <>
                  {selectedDay.override && (
                    <Button
                      color="inherit"
                      startIcon={<DeleteOutlineRounded />}
                      onClick={removeOverride}
                      disabled={saving}
                    >
                      Standaard herstellen
                    </Button>
                  )}

                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<BlockRounded />}
                    onClick={() => saveOverride(false)}
                    disabled={saving}
                  >
                    Blokkeren
                  </Button>

                  <Button
                    color="success"
                    variant="contained"
                    startIcon={<EventAvailableRounded />}
                    onClick={() => saveOverride(true)}
                    disabled={saving}
                  >
                    Beschikbaar maken
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default BookingCalendar;