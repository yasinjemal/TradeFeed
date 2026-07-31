export default function HuntRoomLoading() {
  return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="aspect-[4/3] rounded-3xl bg-tf-stone-200" />
      <div className="space-y-5">
        <div className="h-40 rounded-2xl bg-tf-stone-200" />
        <div className="h-28 rounded-2xl bg-tf-stone-200" />
        <div className="h-72 rounded-2xl bg-tf-stone-200" />
      </div>
    </div>
  );
}
