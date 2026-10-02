/** Case- and accent-insensitive form for matching names ("Tiësto" ≈ "tiesto", "FISHER" ≈ "fisher"). */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
