import { redirect } from 'next/navigation'

// Waste recording is handled through the quick movement form
// Pre-filter to waste_out type
export default function WastePage() {
  redirect('/movements?type=waste_out')
}
