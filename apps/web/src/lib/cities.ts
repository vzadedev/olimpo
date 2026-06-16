export type CityOption = {
  id: number;
  name: string;
  state: string;
  label: string;
};

let cache: CityOption[] | null = null;

export async function searchCities(query: string): Promise<CityOption[]> {
  if (!cache) {
    const res = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/municipios',
    );
    if (!res.ok) throw new Error('Não foi possível carregar cidades');
    const data = (await res.json()) as {
      id: number;
      nome: string;
      microrregiao: { mesorregiao: { UF: { sigla: string } } };
    }[];
    cache = data.map((c) => ({
      id: c.id,
      name: c.nome,
      state: c.microrregiao.mesorregiao.UF.sigla,
      label: `${c.nome} - ${c.microrregiao.mesorregiao.UF.sigla}`,
    }));
  }

  const q = query.trim().toLowerCase();
  if (!q) return cache.slice(0, 20);
  return cache
    .filter((c) => c.label.toLowerCase().includes(q))
    .slice(0, 20);
}

export function normalizeCityLabel(label: string) {
  return label.trim();
}
