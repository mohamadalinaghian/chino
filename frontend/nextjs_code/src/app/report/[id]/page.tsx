
export default async function ReportDetals() {
  type m = {
    name: string;
    price: number;
  }
  const url = 'http://localhost:8000/api/menu/items'
  const report = await fetch(url);
  const res: m[] = await report.json();



  return (
    <div>
      <h1>{res.map((r) => <h3>{JSON.stringify(r, null, 2)}</h3>)}</h1>

    </div>
  )
}
