// Router a hash:  #/            -> panoramica
//                 #/<modulo>            -> dashboard del modulo
//                 #/<modulo>/<sezione>  -> tabella (sezione = suffisso della tabella)
export const go = (mod, suffix) => {
  const h = !mod ? "#/" : suffix ? `#/${mod}/${suffix}` : `#/${mod}`;
  if (location.hash === h) window.dispatchEvent(new Event("hashchange"));
  else location.hash = h;
};

export const parse = () => {
  const [mod, suffix] = location.hash.replace(/^#\/?/, "").split("/");
  if (!mod) return { view: "home" };
  return suffix ? { view: "tabella", mod, suffix } : { view: "modulo", mod };
};

export const onRoute = (fn) => {
  window.addEventListener("hashchange", () => fn(parse()));
  return () => fn(parse());
};
