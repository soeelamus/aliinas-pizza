let currentStep = 0;
const steps = document.querySelectorAll(".step");

// Alle velden verplicht
const requiredFields = [
  ["locatie", "datum"], // STEP 1
  ["voornaam", "email"], // STEP 2
  ["gasten", "info"], // STEP 3
];

const progress = [
  document.getElementById("prog1"),
  document.getElementById("prog2"),
  document.getElementById("prog3"),
];

function showStep(step) {
  // Toon de juiste step
  steps.forEach((el, i) => el.classList.toggle("active", i === step));

  // Update progress bar
  progress.forEach((p, i) => {
    if (i <= step) {
      p.classList.add("active"); // balkje ingekleurd
    } else {
      p.classList.remove("active"); // balkje uit
    }
  });
}

// Controleer of alle velden van de huidige stap zijn ingevuld
function canProceed() {
  const fields = requiredFields[currentStep];
  let valid = true;

  for (let name of fields) {
    const f = document.getElementById(name);
    const errorSpan = document.getElementById(`error-${name}`);
    if (!f.value.trim()) {
      f.classList.add("error");
      errorSpan.textContent = "Vul dit veld in";
      valid = false;
    } else {
      f.classList.remove("error");
      errorSpan.textContent = "";
    }
  }
  return valid;
}

function nextStep() {
  if (!canProceed()) return;
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
}

// Submit-check: controleer alle stappen
document.getElementById("multiForm").addEventListener("submit", function (e) {
  for (let i = 0; i < requiredFields.length; i++) {
    for (let name of requiredFields[i]) {
      const f = document.getElementById(name);
      if (!f || f.value.trim() === "") {
        e.preventDefault();
        alert("Vul alstublieft alle verplichte velden in!");
        f.focus();
        return false;
      }
    }
  }
});

showStep(currentStep);
