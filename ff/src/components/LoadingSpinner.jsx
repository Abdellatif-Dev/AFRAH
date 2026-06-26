export default function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className={`${sizes[size]} border-2 border-gray-100 border-t-gold-500 rounded-full animate-spin`} />
    </div>
  );
}
