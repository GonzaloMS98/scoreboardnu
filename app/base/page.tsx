"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEAMS, STAGES, getBasesByStage } from "@/lib/data";
import { Loader2, LogOut, CheckCircle } from "lucide-react";

type Score = {
  id: string;
  team_id: string;
  points: number;
  created_at: string;
};

type Profile = {
  id: string;
  role: string;
  base_id: string | null;
};

export default function BasePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedStage, setSelectedStage] = useState("noche");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  
  // Get bases for selected stage
  const BASES = getBasesByStage(selectedStage);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Get role and base_id from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, base_id")
        .eq("id", user.id)
        .single();

      const role = profileData?.role || "base";
      const baseId = profileData?.base_id || null;

      if (role === "admin") {
        router.push("/admin");
        return;
      }

      setProfile({
        id: user.id,
        role: role,
        base_id: baseId,
      });

      // Load user's scores for the current stage
      const { data: scoresData } = await supabase
        .from("scores")
        .select("*")
        .eq("created_by", user.id)
        .eq("stage", "noche")
        .order("created_at", { ascending: false });

      if (scoresData) {
        setScores(scoresData);
      }
      setLoadingScores(false);
    }

    loadData();
  }, [supabase, router]);

  // Reload scores when stage changes
  useEffect(() => {
    async function loadStageScores() {
      if (!profile) return;
      setLoadingScores(true);
      const { data: scoresData } = await supabase
        .from("scores")
        .select("*")
        .eq("created_by", profile.id)
        .eq("stage", selectedStage)
        .order("created_at", { ascending: false });
      if (scoresData) {
        setScores(scoresData);
      }
      setLoadingScores(false);
    }
    loadStageScores();
  }, [selectedStage, profile, supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!selectedTeam || !points) {
      setError("Selecciona un equipo y puntos");
      return;
    }
    
    if (!profile?.base_id) {
      setError("No tienes una base asignada. Contacta al administrador.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    const { data, error: upsertError } = await supabase
      .from("scores")
      .upsert(
        {
          base_id: profile.base_id,
          team_id: selectedTeam,
          points: parseInt(points),
          created_by: user.id,
          stage: selectedStage,
        },
        { onConflict: "base_id,team_id,stage" }
      )
      .select()
      .single();

    if (upsertError) {
      setError(upsertError.message);
    } else if (data) {
      setSuccess(true);
      // Update or add score in local state
      const existingIdx = scores.findIndex(s => s.team_id === selectedTeam);
      if (existingIdx >= 0) {
        const updated = [...scores];
        updated[existingIdx] = data;
        setScores(updated);
      } else {
        setScores([data, ...scores]);
      }
      setSelectedTeam("");
      setPoints("");
      setTimeout(() => setSuccess(false), 2000);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const baseName =
    BASES.find((b) => b.id === profile?.base_id)?.name || "Sin asignar";

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{baseName}</h1>
            <p className="text-sm text-muted-foreground">Asignar puntos</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </div>

        {/* Score Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Nuevo puntaje</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="team">Equipo</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Selecciona un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="points">Puntos</Label>
                <Input
                  id="points"
                  type="number"
                  placeholder="0"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min={0}
                  required
                />
              </div>
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
              {success && (
                <p className="text-green-600 text-sm text-center flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Guardado correctamente
                </p>
              )}
              <Button
                type="submit"
                disabled={loading || !selectedTeam || !points}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar puntos"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Scores */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Mis puntuaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingScores ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : scores.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay puntuaciones aún
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {scores.map((score) => {
                  const teamName =
                    TEAMS.find((t) => t.id === score.team_id)?.name ||
                    score.team_id;
                  return (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="font-medium">{teamName}</span>
                      <span className="text-lg font-bold">
                        {score.points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
