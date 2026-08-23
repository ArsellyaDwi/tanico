export function buildStorageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sfjynaclpdsaedhqwkqb.supabase.co';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${supabaseUrl}/storage/v1/object/public/tanico-uploads/${cleanPath}`;
}
export default buildStorageUrl;
