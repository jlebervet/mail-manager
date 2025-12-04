import { useState, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { API } from "../App";

const ImportPage = ({ user }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const isAdmin = user?.role === "admin";

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
        toast.error("Veuillez sélectionner un fichier CSV");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== "text/csv" && !droppedFile.name.endsWith('.csv')) {
        toast.error("Veuillez sélectionner un fichier CSV");
        return;
      }
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/import/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      
      const total = response.data.correspondents_created + response.data.mails_created;
      if (response.data.errors.length === 0) {
        toast.success(`Import réussi ! ${total} élément(s) importé(s)`);
      } else {
        toast.warning(`Import terminé avec ${response.data.errors.length} erreur(s)`);
      }
      
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `nom,prenom,telephone_fixe,telephone_mobile,adresse_mail,adresse_postale,titre_message,type,statut
Dupont,Jean,0123456789,0612345678,jean.dupont@example.com,"12 Rue de la Paix, 75000 Paris","Demande de renseignements",entrant,en_cours
Martin,Sophie,,0698765432,sophie.martin@example.com,"45 Avenue des Champs, 75000 Paris","Réponse à la demande",sortant,archive`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_import.csv';
    link.click();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Import CSV</h1>
        <p className="text-slate-600">
          Importez vos messages et contacts depuis votre ancienne application
        </p>
      </div>

      {/* Template Download */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Modèle CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Téléchargez le modèle CSV pour voir le format attendu
          </p>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            data-testid="download-template-button"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger le modèle
          </Button>
        </CardContent>
      </Card>

      {/* Format Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Format du fichier CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">Colonnes pour les contacts :</p>
              <ul className="space-y-1 text-blue-800">
                <li>• <strong>nom</strong> (requis)</li>
                <li>• <strong>prenom</strong></li>
                <li>• <strong>telephone_fixe</strong></li>
                <li>• <strong>telephone_mobile</strong></li>
                <li>• <strong>adresse_mail</strong></li>
                <li>• <strong>adresse_postale</strong></li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900 mb-2">Colonnes pour les messages :</p>
              <ul className="space-y-1 text-green-800">
                <li>• <strong>titre_message</strong> (requis)</li>
                <li>• <strong>type</strong> : "entrant" ou "sortant"</li>
                <li>• <strong>statut</strong> : "en_cours" ou "archive"</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les contacts existants (même nom) seront mis à jour avec les nouvelles informations.
              Tous les messages importés seront assignés au service par défaut.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer un fichier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600 mb-2">
              {file ? file.name : "Glissez-déposez votre fichier CSV ici"}
            </p>
            <p className="text-sm text-slate-500">ou cliquez pour sélectionner</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setFile(null)}
                variant="ghost"
                size="sm"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="import-button"
          >
            {importing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Lancer l'import
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              Résultat de l'import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium mb-1">Contacts créés</p>
                <p className="text-3xl font-bold text-green-900">
                  {result.correspondents_created}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-1">Messages importés</p>
                <p className="text-3xl font-bold text-blue-900">
                  {result.mails_created}
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600 font-medium mb-1">Erreurs</p>
                <p className="text-3xl font-bold text-amber-900">
                  {result.errors.length}
                </p>
              </div>
            </div>

            {result.correspondents_updated > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.correspondents_updated} contact(s) existant(s) mis à jour
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-slate-900">Erreurs rencontrées :</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 bg-red-50 text-red-800 rounded"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportPage;
