import { supabase } from "../src/lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const cookies = req.headers.cookie || "";

  const hasEmployeesAuth = cookies.includes(
    `employeesAuth=${process.env.API_TOKEN}`,
  );

  const action = req.body?.action;

  const isEmployeeLogin =
    req.method === "POST" && action === "employeeLogin";

  if (!hasEmployeesAuth && !isEmployeeLogin) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  try {
    // =====================================================
    // GET
    // =====================================================

    if (req.method === "GET") {
      const { id, action: queryAction, employeeId } = req.query;

      // Huidige actieve shift
      if (queryAction === "currentShift" && employeeId) {
        const { data, error } = await supabase
          .from("time_entries")
          .select("*")
          .eq("employee_id", employeeId)
          .is("clock_out", null)
          .order("clock_in", { ascending: false })
          .maybeSingle();

        if (error) throw error;

        return res.status(200).json({
          ok: true,
          shift: data,
        });
      }

      // Alle werkuren van werknemer
      if (queryAction === "timeEntries" && employeeId) {
        const { data, error } = await supabase
          .from("time_entries")
          .select(`
            id,
            employee_id,
            clock_in,
            clock_out,
            location_id,
            notes,
            locations (
              id,
              name
            )
          `)
          .eq("employee_id", employeeId)
          .order("clock_in", { ascending: false });

        if (error) throw error;

        return res.status(200).json({
          ok: true,
          timeEntries: data || [],
        });
      }

      // Eén werknemer
      if (id) {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        return res.status(200).json({
          ok: true,
          employee: data,
        });
      }

      // Alle werknemers
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (error) throw error;

      return res.status(200).json({
        ok: true,
        employees: data || [],
      });
    }

    // =====================================================
    // POST
    // =====================================================

    if (req.method === "POST") {
      // Werknemer-login
      if (action === "employeeLogin") {
        const { employeeId, pin } = req.body;

        if (!employeeId || !pin) {
          return res.status(400).json({
            success: false,
            error: "Employee ID en pincode zijn verplicht",
          });
        }

        const { data: employee, error } = await supabase
          .from("employees")
          .select("id, pincode, active")
          .eq("id", employeeId)
          .single();

        if (error || !employee) {
          return res.status(401).json({
            success: false,
            error: "Werknemer niet gevonden",
          });
        }

        if (!employee.active) {
          return res.status(401).json({
            success: false,
            error: "Werknemer is niet actief",
          });
        }

        if (Number(pin) !== Number(employee.pincode)) {
          return res.status(401).json({
            success: false,
            error: "Pincode is onjuist",
          });
        }

        return res.status(200).json({
          success: true,
          employeeId: employee.id,
        });
      }

      // Nieuwe werknemer
      if (action === "createEmployee") {
        const employee = req.body.employee;

        if (!employee?.name || !employee?.role) {
          return res.status(400).json({
            ok: false,
            error: "Naam en rol zijn verplicht",
          });
        }

        const { data, error } = await supabase
          .from("employees")
          .insert({
            name: employee.name,
            role: employee.role,
            hourly_rate: employee.hourly_rate ?? 12.5,
            active: employee.active ?? true,
            phone: employee.phone || null,
            email: employee.email || null,
            iban: employee.iban || null,
            pincode: employee.pincode ?? 1111,
            nfc_uid: employee.nfc_uid || null,
            notes: employee.notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          ok: true,
          employee: data,
        });
      }

      // Inklokken
      if (action === "clockIn") {
        const { employeeId, locationId, notes } = req.body;

        if (!employeeId) {
          return res.status(400).json({
            ok: false,
            error: "Employee ID ontbreekt",
          });
        }

        const { data: existingShift, error: existingError } = await supabase
          .from("time_entries")
          .select("id, clock_in")
          .eq("employee_id", employeeId)
          .is("clock_out", null)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existingShift) {
          return res.status(409).json({
            ok: false,
            error: "Werknemer is al ingeklokt",
            shift: existingShift,
          });
        }

        const { data, error } = await supabase
          .from("time_entries")
          .insert({
            employee_id: employeeId,
            clock_in: new Date().toISOString(),
            clock_out: null,
            location_id: locationId || null,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          ok: true,
          shift: data,
        });
      }

      // Uitklokken
      if (action === "clockOut") {
        const { employeeId } = req.body;

        if (!employeeId) {
          return res.status(400).json({
            ok: false,
            error: "Employee ID ontbreekt",
          });
        }

        const { data: activeShift, error: activeShiftError } = await supabase
          .from("time_entries")
          .select("id")
          .eq("employee_id", employeeId)
          .is("clock_out", null)
          .order("clock_in", { ascending: false })
          .maybeSingle();

        if (activeShiftError) throw activeShiftError;

        if (!activeShift) {
          return res.status(404).json({
            ok: false,
            error: "Geen actieve shift gevonden",
          });
        }

        const { data, error } = await supabase
          .from("time_entries")
          .update({
            clock_out: new Date().toISOString(),
          })
          .eq("id", activeShift.id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          ok: true,
          shift: data,
        });
      }

      return res.status(400).json({
        ok: false,
        error: "Unknown action",
      });
    }

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("[employees]", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Server error",
    });
  }
}