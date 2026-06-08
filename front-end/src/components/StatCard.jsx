export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
        <Icon size={20} />
      </div>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-950">{value}</p>
    </div>
  )
}
