import { $, esc, nice } from "../../core/utils.js";
import { state } from "../../core/state.js";
import { api } from "../../core/api.js";
import { icona } from "../../core/icone.js";
import { toast } from "../toast/toast.js";

const drawer = () => $("#drawer"), scrim = () => $("#drawerScrim");
export const chiudiForm = () => {
  drawer().classList.remove("open");
  scrim().classList.remove("open");
};

export async function apriForm(table, meta, id, dopoSalvataggio) {
  state.editId = id;
  const row = id ? await api(`/api/tables/${table}/${id}`) : {};
  $("#drawerTitle").textContent = id
    ? `Modifica ${meta.label.toLowerCase()} #${id}`
    : `Nuovo record · ${meta.label}`;
  const cols = meta.columns.filter((c) => !c.pk && c.name !== "created_at");
  const opts = {};
  await Promise.all(
    cols.filter((c) => c.fk).map(async (c) => {
      opts[c.name] = await api(`/api/tables/${c.fk.table}/options`).catch(() => []);
    }),
  );
  $("#fields").innerHTML = cols
    .map((c) => {
      const req = c.notnull ? " required" : "";
      const label = `<label for="f_${c.name}">${esc(nice(c.name))}${c.notnull ? " <i>*</i>" : ""}</label>`;
      let input;
      if (c.fk)
        input = `<select id="f_${c.name}" name="${c.name}"${req}><option value="">–</option>${opts[c.name].map((o) => `<option value="${o.id}" ${String(row[c.name]) === String(o.id) ? "selected" : ""}>${esc(o.label)} (#${o.id})</option>`).join("")}</select>`;
      else if (c.type === "bool")
        return `<div class="field"><label class="check"><input type="checkbox" name="${c.name}" ${(id ? row[c.name] : 1) ? "checked" : ""}> ${esc(nice(c.name))}</label></div>`;
      else
        input = `<input id="f_${c.name}" name="${c.name}" type="${c.type === "date" ? "date" : c.type === "real" || c.type === "int" ? "number" : "text"}"${c.type === "real" ? ' step="any"' : ""} value="${esc(row[c.name])}"${req}>`;
      return `<div class="field">${label}${input}</div>`;
    })
    .join("");
  drawer().classList.add("open");
  scrim().classList.add("open");
  drawer().querySelector("input,select")?.focus();
  state.afterSave = dopoSalvataggio;
}

export function initForm() {
  $("#drawerClose").innerHTML = icona("chiudi");
  $("#drawerClose").onclick = $("#drawerCancel").onclick = chiudiForm;
  scrim().onclick = chiudiForm;
  document.addEventListener("keydown", (e) => e.key === "Escape" && chiudiForm());
  $("#form").onsubmit = async (e) => {
    e.preventDefault();
    const body = {};
    for (const el of e.target.elements)
      if (el.name) body[el.name] = el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value;
    const table = `${state.route.mod}_${state.route.suffix}`;
    try {
      state.editId
        ? await api(`/api/tables/${table}/${state.editId}`, "PUT", body)
        : await api(`/api/tables/${table}`, "POST", body);
      toast("Record salvato");
      chiudiForm();
      state.afterSave?.();
    } catch (err) {
      toast(err.message, true);
    }
  };
}
