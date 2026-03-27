"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TEAMS, STAGES, getBasesByStage } from "@/lib/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, LogOut, Trash2 } from "lucide-react";

type Score = {
  id: string;
  base_id: string;
  team_id: string;
  points: number;
};

export default function AdminPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedStage, setSelectedStage] = useState("noche");
  const router = useRouter();
  const supabase = createClient();
  
  // Get bases for selected stage
  const BASES = getBasesByStage(selectedStage);

  async function loadScores(stage: string = selectedStage) {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("stage", stage);
    if (data) {
      setScores(data);
    }
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/base");
        return;
      }

      await loadScores();
      setLoading(false);
    }

    init();
  }, [supabase, router]);

  // Reload scores when stage changes
  useEffect(() => {
    if (!loading) {
      loadScores(selectedStage);
    }
  }, [selectedStage]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadScores(selectedStage);
    setRefreshing(false);
  }

  async function handleReset() {
    setResetting(true);
    const { error } = await supabase.from("scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (!error) {
      setScores([]);
    }
    setResetting(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  // Calculate totals per team
  const teamTotals = TEAMS.map((team) => {
    const total = scores
      .filter((s) => s.team_id === team.id)
      .reduce((sum, s) => sum + s.points, 0);
    return { ...team, total };
  }).sort((a, b) => b.total - a.total);

  // Get score for team + base combo
  const getScore = (teamId: string, baseId: string) => {
    return scores
      .filter((s) => s.team_id === teamId && s.base_id === baseId)
      .reduce((sum, s) => sum + s.points, 0);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-3">
      <div className="max-w-full mx-auto flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Admin</h1>
          <div className="flex items-center gap-2">
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[160px] h-9">
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9 bg-transparent"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Actualizar</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </div>

        {/* Reset Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="lg" className="w-full">
              <Trash2 className="mr-2 h-5 w-5" />
              Reiniciar Todo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reiniciar puntuaciones</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán todas las puntuaciones. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                disabled={resetting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {resetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Score Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2 font-semibold sticky left-0 bg-muted border-r">
                  Equipo
                </th>
                {BASES.map((base) => (
                  <th
                    key={base.id}
                    className="text-center p-2 font-semibold min-w-[80px] text-[10px] leading-tight"
                    title={base.name}
                  >
                    {base.name}
                  </th>
                ))}
                <th className="text-center p-2 font-bold min-w-[50px] bg-muted/80 border-l">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {teamTotals.map((team, idx) => (
                <tr
                  key={team.id}
                  className={`${idx % 2 === 0 ? "bg-background" : "bg-muted/30"} border-t`}
                >
                  <td className="p-2 font-medium sticky left-0 bg-inherit border-r">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 border border-foreground/20"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="truncate">{team.name}</span>
                    </div>
                  </td>
                  {BASES.map((base) => {
                    const score = getScore(team.id, base.id);
                    return (
                      <td key={base.id} className="text-center p-2">
                        {score > 0 ? score : "-"}
                      </td>
                    );
                  })}
                  <td className="text-center p-2 font-bold bg-muted/50 border-l">
                    {team.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Team Totals Summary */}
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-semibold mb-3">Total de Puntos por Equipo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {teamTotals.map((team, idx) => (
              <div
                key={team.id}
                className="relative rounded-lg p-3 text-center overflow-hidden"
                style={{ backgroundColor: team.color }}
              >
                <div 
                  className="absolute inset-0 bg-black/20"
                  style={{ display: idx === 0 && team.total > 0 ? 'none' : 'block' }}
                />
                <div className="relative z-10">
                  <p className="text-xs font-medium text-white/90 drop-shadow-sm">
                    {idx === 0 && team.total > 0 && "🏆 "}
                    {team.name}
                  </p>
                  <p className="text-xl font-bold text-white drop-shadow-md">
                    {team.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </main>
  );
}
