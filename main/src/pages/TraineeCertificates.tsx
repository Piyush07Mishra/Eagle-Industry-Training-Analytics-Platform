import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, CheckCircle, Calendar, BookOpen } from "lucide-react";
import { apiGet, apiFetch, API_BASE_URL } from "@/api/axios";

interface Certificate {
  id: number;
  certificate_number: string;
  issued_date: string;
  is_valid: boolean;
  course: number;
  session: number;
  course_title?: string;
  session_title?: string;
}

const TraineeCertificates: React.FC = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    apiGet<Certificate[]>("/api/trainee/certificates/")
      .then((d) => { setCerts(d); setLoading(false); })
      .catch(() => { setError("Failed to load certificates."); setLoading(false); });
  }, []);

  const handleDownload = async (certId: number, certNumber: string) => {
    setDownloading(certId);
    try {
      const res = await apiFetch(`/api/certificates/${certId}/pdf/`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${certNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download certificate. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading certificates...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600 mt-1">Download and view your earned training certificates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900">{certs.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid</p>
              <p className="text-2xl font-bold text-gray-900">{certs.filter(c => c.is_valid).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Courses Completed</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(certs.map(c => c.course)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Certificates Grid */}
      {certs.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No certificates yet</p>
          <p className="text-gray-400 text-sm mt-1">Complete training sessions to earn certificates</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((cert) => (
            <Card key={cert.id} className={`p-6 border-2 ${cert.is_valid ? "border-green-100 bg-green-50/30" : "border-gray-100 opacity-75"}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Award className="w-7 h-7 text-green-600" />
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cert.is_valid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {cert.is_valid ? "Valid" : "Expired"}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg">
                {cert.course_title || `Course #${cert.course}`}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {cert.session_title || `Session #${cert.session}`}
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Cert No:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{cert.certificate_number}</span>
                </div>
                {cert.issued_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Issued: {new Date(cert.issued_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleDownload(cert.id, cert.certificate_number)}
                disabled={downloading === cert.id}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Download className="w-4 h-4" />
                {downloading === cert.id ? "Downloading..." : "Download PDF"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TraineeCertificates;
