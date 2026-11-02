export async function callApi(payload) {
  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Backend not reachable (status ${res.status}). Run "vercel dev" or use the deployed link.`
    );
  }

  if (!res.ok) throw new Error(data.error || "Request failed");
  return data.result;
}