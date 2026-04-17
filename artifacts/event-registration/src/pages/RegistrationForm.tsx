import { useState, useRef, FormEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import {
  User,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  MapPin,
  ChevronDown,
  CheckSquare,
} from "lucide-react";

interface FormData {
  nama: string;
  email: string;
  wa: string;
  gender: string;
  dob: Date | null;
  alamat: string;
  catatan: string;
  agree: boolean;
}

function validateForm(data: FormData): string | null {
  if (!data.nama.trim()) return "Nama wajib diisi";
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return "Email tidak valid";
  if (!data.wa || !/^62\d{8,15}$/.test(data.wa))
    return "Nomor WA harus diawali 62 dan panjang 10–17 digit";
  if (!data.gender) return "Pilih jenis kelamin";
  if (!data.dob) return "Tanggal lahir wajib diisi";
  if (!data.alamat.trim()) return "Alamat wajib diisi";
  if (!data.catatan.trim()) return "Catatan wajib diisi";
  if (!data.agree) return "Anda harus menyetujui syarat & ketentuan";
  return null;
}

interface InputCardProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  hasValue?: boolean;
  isFocused?: boolean;
}

function InputCard({ icon, label, children, hasValue, isFocused }: InputCardProps) {
  const active = hasValue || isFocused;
  return (
    <div className="input-card">
      <span className={`input-icon ${isFocused ? "icon-focused" : ""}`}>{icon}</span>
      {children}
      <label className={`floating-label ${active ? "label-float" : ""} ${isFocused ? "label-focused" : ""}`}>
        {label}
      </label>
    </div>
  );
}

export default function RegistrationForm() {
  const [form, setForm] = useState<FormData>({
    nama: "",
    email: "",
    wa: "",
    gender: "",
    dob: null,
    alamat: "",
    catatan: "",
    agree: false,
  });

  const [focused, setFocused] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setField = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFocus = (key: string) =>
    setFocused((prev) => ({ ...prev, [key]: true }));
  const handleBlur = (key: string) =>
    setFocused((prev) => ({ ...prev, [key]: false }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateForm(form);
    if (err) {
      Swal.fire({ icon: "error", title: "Oops...", text: err, confirmButtonColor: "#0097e6" });
      return;
    }

    setSubmitting(true);
    Swal.fire({
      title: "Sedang memproses...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await new Promise((r) => setTimeout(r, 1200));

    setSubmitting(false);
    Swal.fire({
      icon: "success",
      title: "Sukses!",
      html: `Pendaftaran atas nama <b>${form.nama}</b> berhasil dikirim!`,
      confirmButtonColor: "#0097e6",
    });
    setForm({
      nama: "",
      email: "",
      wa: "",
      gender: "",
      dob: null,
      alamat: "",
      catatan: "",
      agree: false,
    });
    setFocused({});
  };

  const maxDate = new Date(new Date().getFullYear() - 1, 11, 31);

  return (
    <div className="page-bg">
      <div className="form-container">
        <div className="form-header">
          <img
            src="https://drive.google.com/thumbnail?id=1nGLifMcSpAk5x8Ckb1K_Hmy5r91YLJIO&sz=w1000"
            alt="Logo"
            className="form-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <h2 className="form-title">Pendaftaran Event</h2>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <InputCard
            icon={<User size={16} />}
            label="Nama Lengkap"
            hasValue={!!form.nama}
            isFocused={focused.nama}
          >
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setField("nama", e.target.value)}
              onFocus={() => handleFocus("nama")}
              onBlur={() => handleBlur("nama")}
              className="form-input"
              placeholder=" "
            />
          </InputCard>

          <InputCard
            icon={<Mail size={16} />}
            label="Email"
            hasValue={!!form.email}
            isFocused={focused.email}
          >
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              onFocus={() => handleFocus("email")}
              onBlur={() => handleBlur("email")}
              className="form-input"
              placeholder=" "
            />
          </InputCard>

          <InputCard
            icon={<Phone size={16} />}
            label="No. WhatsApp (62...)"
            hasValue={!!form.wa}
            isFocused={focused.wa}
          >
            <input
              type="text"
              value={form.wa}
              onChange={(e) => setField("wa", e.target.value)}
              onFocus={() => handleFocus("wa")}
              onBlur={() => handleBlur("wa")}
              className="form-input"
              placeholder=" "
            />
          </InputCard>

          <InputCard
            icon={<CheckSquare size={16} />}
            label="Jenis Kelamin"
            hasValue={!!form.gender}
            isFocused={focused.gender}
          >
            <div className="select-wrapper">
              <select
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
                onFocus={() => handleFocus("gender")}
                onBlur={() => handleBlur("gender")}
                className="form-input form-select"
              >
                <option value="" disabled />
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>
          </InputCard>

          <InputCard
            icon={<Calendar size={16} />}
            label="Tanggal Lahir"
            hasValue={!!form.dob}
            isFocused={focused.dob}
          >
            <DatePicker
              selected={form.dob}
              onChange={(date) => setField("dob", date)}
              onFocus={() => handleFocus("dob")}
              onBlur={() => handleBlur("dob")}
              dateFormat="yyyy-MM-dd"
              maxDate={maxDate}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              placeholderText=" "
              className="form-input datepicker-input"
              popperPlacement="bottom-start"
            />
          </InputCard>

          <InputCard
            icon={<MapPin size={16} />}
            label="Alamat / Kota"
            hasValue={!!form.alamat}
            isFocused={focused.alamat}
          >
            <input
              type="text"
              value={form.alamat}
              onChange={(e) => setField("alamat", e.target.value)}
              onFocus={() => handleFocus("alamat")}
              onBlur={() => handleBlur("alamat")}
              className="form-input"
              placeholder=" "
            />
          </InputCard>

          <InputCard
            icon={<MessageSquare size={16} />}
            label="Pertanyaan / Catatan"
            hasValue={!!form.catatan}
            isFocused={focused.catatan}
          >
            <textarea
              value={form.catatan}
              onChange={(e) => setField("catatan", e.target.value)}
              onFocus={() => handleFocus("catatan")}
              onBlur={() => handleBlur("catatan")}
              className="form-input form-textarea"
              placeholder=" "
              rows={3}
            />
          </InputCard>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="agree"
              checked={form.agree}
              onChange={(e) => setField("agree", e.target.checked)}
              className="form-checkbox"
            />
            <label htmlFor="agree" className="checkbox-label">
              Saya setuju dengan syarat &amp; ketentuan
            </label>
          </div>

          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
