// Select this whole block, then press Cmd/Ctrl+Alt+S → CodeSnap!
interface Repo {
  name: string;
  stars: number;
}

async function trending(lang: string): Promise<Repo[]> {
  const res = await fetch(`https://api.github.com/search/repositories?q=language:${lang}&sort=stars`);
  const { items } = await res.json();
  return items.slice(0, 5).map((r: any) => ({ name: r.full_name, stars: r.stargazers_count }));
}

trending("typescript").then((repos) =>
  repos.forEach((r) => console.log(`⭐️ ${r.stars.toLocaleString()}  ${r.name}`))
);
