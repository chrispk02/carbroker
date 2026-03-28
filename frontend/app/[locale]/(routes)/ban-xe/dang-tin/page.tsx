import type { Metadata } from "next"
import { PostCarForm } from "@/components/pages/post-car-form"

export const metadata: Metadata = {
  title: "Đăng tin bán xe - CarBroker",
  description: "Đăng tin bán xe nhanh chóng, miễn phí trên CarBroker.",
}

export default function DangTinPage() {
  return <PostCarForm />
}
