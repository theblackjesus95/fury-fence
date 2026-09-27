"use strict";
document.documentElement.classList.add("js");
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-nav");
if (toggle && nav) {
  const close = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
  };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      close();
      toggle.focus();
    }
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });
}
const form = document.querySelector("form[data-lead-form]");
if (form) {
  const status = document.querySelector("#form-status");
  const submit = form.querySelector("button[type=submit]");
  const initialText = submit.textContent;
  let sending = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending || !form.reportValidity()) return;
    const values = Object.fromEntries(
      [...new FormData(form)].map(([key, value]) => [
        key,
        String(value).trim(),
      ]),
    );
    const contact = form.dataset.leadForm === "contact";
    const required = contact
      ? ["name", "email", "message"]
      : ["email", "phone"];
    if (required.some((key) => !values[key])) {
      status.className = "form-status error";
      status.textContent = "Please complete the required fields.";
      status.focus();
      return;
    }
    let payload;
    if (contact)
      payload = {
        name: values.name,
        email: values.email,
        message: values.message,
      };
    else {
      const keys = [
        "name",
        "email",
        "phone",
        "address",
        "fenceType",
        "linearFootage",
        "fenceHeight",
        "corners",
        "endpoints",
        "singleGates",
        "doubleGates",
        "cantileverGates",
        "description",
      ];
      payload = Object.fromEntries(keys.map((key) => [key, values[key] || ""]));
      const context = [
        ["Company", values.company],
        ["Property / project type", values.projectType],
        ["Work requested", values.workType],
        ["Desired schedule", values.timeline],
      ]
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`);
      payload.description = [...context, values.description]
        .filter(Boolean)
        .join("\n\n");
    }
    sending = true;
    submit.disabled = true;
    submit.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    status.className = "form-status";
    status.textContent = "Submitting your request…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(contact ? "/api/contact" : "/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }
      if (!response.ok || result.success !== true)
        throw new Error("Request not accepted");
      status.className = "form-status success";
      status.textContent =
        "Thank you. Your request has been submitted. For a time-sensitive question, call 825-967-0979.";
      form.reset();
    } catch (error) {
      status.className = "form-status error";
      status.textContent =
        "We could not confirm your submission. Your details are still here. Please call 825-967-0979 or email info@furyfence.com before resending if you are unsure whether it went through.";
    } finally {
      clearTimeout(timeout);
      sending = false;
      submit.disabled = false;
      submit.textContent = initialText;
      form.removeAttribute("aria-busy");
      status.focus();
    }
  });
}
