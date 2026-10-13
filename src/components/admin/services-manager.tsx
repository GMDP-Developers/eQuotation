"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { CAPACITY_UNITS, type CapacityUnit } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { textareaClass } from "@/lib/form-classes";

const ApiResponse = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

export type ServiceData = {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  imagePreview: string | null;
  imageFull: string | null;
  sortOrder: number;
  active: boolean;
  bestSeller: boolean;
  lockedCapacity: number | null;
  lockedCapacityUnit: CapacityUnit | null;
  createdAt: string;
};

export function ServicesManager({ services: initialServices }: { services: ServiceData[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState(initialServices);

  useEffect(() => setServices(initialServices), [initialServices]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id);
      const newIndex = services.findIndex((s) => s.id === over.id);
      const newServices = arrayMove(services, oldIndex, newIndex);
      setServices(newServices);
      
      const updated = newServices.map((s, i) => ({ id: s.id, sortOrder: i }));
      await fetch("/api/admin/services/reorder", {
        method: "POST",
        body: JSON.stringify({ items: updated }),
      });
      toast.success("Urutan disimpan.");
      router.refresh();
    }
  }

  function SortableRow({ svc }: { svc: ServiceData }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: svc.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const thumb = svc.imagePreview ?? svc.imageFull;

    return (
      <TableRow ref={setNodeRef} style={style}>
        <TableCell {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="size-4 text-muted-foreground" />
        </TableCell>
        <TableCell>
          {thumb ? (
            <img src={thumb} alt={svc.name} className="size-10 rounded-md border object-cover" />
          ) : (
            <span className="size-10 rounded-md bg-muted-50" />
          )}
        </TableCell>
        <TableCell className="font-medium">{svc.name}</TableCell>
        <TableCell className="max-w-48 truncate">{svc.subtitle ?? "—"}</TableCell>
        <TableCell>{svc.sortOrder}</TableCell>
        <TableCell>
          {svc.active ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Aktif</span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Nonaktif</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex gap-1.5">
            <Button size="sm" variant={svc.bestSeller ? "default" : "outline"} onClick={() => handleBestSeller(svc)}>
              <Star className={`size-3.5 ${svc.bestSeller ? "fill-current" : ""}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(svc); setShowForm(true); }}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(svc)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("active", (form.elements.namedItem("active") as HTMLInputElement).checked ? "true" : "false");
    for (const key of ["imagePreview", "imageFull"]) {
      const entry = fd.get(key);
      if (entry instanceof File && entry.size === 0) fd.delete(key);
    }
    const lockChecked = Boolean((form.elements.namedItem("lockEnabled") as HTMLInputElement | null)?.checked);
    if (!lockChecked) fd.set("lockedCapacity", "");
    else if (!String(fd.get("lockedCapacity") ?? "").trim()) { toast.error("Isi nilai kapasitas."); return; }
    
    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/admin/services/${editing.id}` : "/api/admin/services", { method: editing ? "PATCH" : "POST", body: fd });
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) {
        toast.error((parsed.success ? parsed.data.error : undefined) ?? "Terjadi kesalahan.");
        return;
      }
      toast.success(editing ? "Layanan diperbarui." : "Layanan ditambahkan.");
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } catch { toast.error("Gagal menghubungi server."); } finally { setSubmitting(false); }
  }

  async function handleDelete(svc: ServiceData) {
    if (!window.confirm(`Hapus "${svc.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, { method: "DELETE" });
      const parsed = ApiResponse.safeParse(await res.json().catch(() => null));
      if (!res.ok || !parsed.success || !parsed.data.ok) { toast.error("Gagal menghapus."); return; }
      toast.success("Layanan dihapus.");
      router.refresh();
    } catch { toast.error("Gagal menghubungi server."); }
  }

  async function handleBestSeller(svc: ServiceData) {
    const fd = new FormData();
    fd.set("bestSeller", svc.bestSeller ? "false" : "true");
    const res = await fetch(`/api/admin/services/${svc.id}`, { method: "PATCH", body: fd });
    if (res.ok) { toast.success("Diperbarui."); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit" : "Tambah"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
              <Input name="name" defaultValue={editing?.name ?? ""} placeholder="Nama" required />
              <Input name="subtitle" defaultValue={editing?.subtitle ?? ""} placeholder="Subtitle" />
              <textarea name="description" defaultValue={editing?.description ?? ""} className={textareaClass} placeholder="Deskripsi" />
              <Input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Layanan</CardTitle>
          <CardAction>
            <Button onClick={() => { setEditing(null); setShowForm(true); }}>Tambah</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Gambar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Subtitle</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={services} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {services.map((svc) => <SortableRow key={svc.id} svc={svc} />)}
                </TableBody>
              </SortableContext>
            </DndContext>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
