"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";

interface Result {
  email: string;
  success: boolean;
  error?: string;
}

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSetup() {
    if (!password) return;
    
    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const response = await fetch("/api/seed-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se pudieron crear los usuarios");
        return;
      }

      setResults(data.results);
    } catch (error) {
      console.error("Setup error:", error);
      setError("No se pudo completar la configuracion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Configurar Usuarios</CardTitle>
          <CardDescription>
            Crear usuarios de bases y admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Se crearán los siguientes usuarios:
            </p>
            <ul className="text-sm space-y-1 bg-muted p-3 rounded-md">
              <li>base1@camino.com - AIR FORCE 1</li>
              <li>base2@camino.com - MATANGA</li>
              <li>base3@camino.com - GATO CORRIDO</li>
              <li>base4@camino.com - CACHIBOL</li>
              <li>base5@camino.com - DE AGUILITA</li>
              <li className="font-medium">admin@camino.com - Admin</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña para todos los usuarios
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSetup}
            disabled={loading || password.length < 6}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando usuarios...
              </>
            ) : (
              "Crear Usuarios"
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {results && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Resultados:</p>
              <ul className="text-sm space-y-1">
                {results.map((result) => (
                  <li
                    key={result.email}
                    className="flex items-center gap-2"
                  >
                    {result.success ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span>{result.email}</span>
                    {result.error && (
                      <span className="text-red-600 text-xs">
                        ({result.error})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
