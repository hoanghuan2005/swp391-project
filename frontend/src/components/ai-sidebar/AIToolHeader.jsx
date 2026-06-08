export default function AIToolHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-[#f26522]">
        <Icon className="w-5 h-5" />
        <h1 className="text-xl font-semibold text-slate-800">
          {title}
        </h1>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}