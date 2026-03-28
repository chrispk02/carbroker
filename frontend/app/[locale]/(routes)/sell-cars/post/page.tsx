import type { Metadata } from "next"
import { PostCarForm } from "@/components/pages/post-car-form"

export const metadata: Metadata = {
  title: "Post Your Car - CarBroker",
  description: "List your car for sale quickly and for free on CarBroker.",
}

export default function PostCarPage() {
  return <PostCarForm />
}
