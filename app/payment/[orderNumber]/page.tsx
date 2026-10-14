import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

export default function PaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-resto-red-800 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PaymentContent params={params} />
    </Suspense>
  );
}

async function PaymentContent({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return <PaymentClient orderNumber={orderNumber} />;
}

