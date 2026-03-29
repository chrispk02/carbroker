import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/vi"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Về trang chủ
        </Link>
        <Link
          href="/vi/mua-xe"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Xem xe
        </Link>
      </div>
    </div>
  )
}
