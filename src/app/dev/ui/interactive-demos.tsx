"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

export function InteractiveDemos() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="grid w-64 gap-1.5">
        <Label htmlFor="demo-select">Tipe unit</Label>
        <Select>
          <SelectTrigger id="demo-select" className="h-11 w-full">
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="36-60">Tipe 36/60</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-11 items-center gap-2">
        <Checkbox id="demo-checkbox" />
        <Label htmlFor="demo-checkbox">
          Saya setuju data saya diproses sesuai kebijakan privasi
        </Label>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Buka dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contoh dialog</DialogTitle>
            <DialogDescription>Dialog dipakai untuk konfirmasi singkat.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Buka sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Contoh sheet</SheetTitle>
            <SheetDescription>Sheet dipakai untuk menu dan filter di layar kecil.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Button
        variant="secondary"
        onClick={() => {
          toast.success("Laporan tersimpan.");
        }}
      >
        Tampilkan toast
      </Button>
      <Toaster />
    </div>
  );
}
