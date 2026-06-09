import MaterialCard from "./MaterialCard";

export default function MaterialList({
  materials,
  onSelect,
}) {
  if (!materials.length) {
    return (
      <div className="text-center py-10 text-slate-400">
        No materials found
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}