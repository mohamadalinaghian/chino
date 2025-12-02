"use client"

import { useEffect, useState } from "react"
import { fetchMenuItems, MenuCategoryGroup } from "@/services/menu"

export default function SaleNewPage() {
  const [data, setData] = useState<MenuCategoryGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuItems()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4 space-y-6">
      {data.map((category) => (
        <div key={category.category}>
          <h2 className="text-xl font-semibold mb-2">{category.category}</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {category.items.map((item) => (
              <button
                key={item.id}
                className="border rounded-lg p-3 shadow-sm hover:bg-gray-50 text-left"
              >
                <div className="font-medium">{item.name}</div>
                <div className="text-gray-600">{item.price} تومان</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
