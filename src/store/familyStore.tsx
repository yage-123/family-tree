import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PersonId = string;
export type Gender = "male" | "female" | "other" | "unknown";
export type BloodType = "A" | "B" | "AB" | "O" | "unknown";

export type Person = {
  id: PersonId;
  name: string;
  gender: Gender;
  bloodType: BloodType;
  birthDate: string;   // 例 "1994-03-15"
  photoUri: string;   // 端末の写真URI
  note: string;

};

export type FamilyEdge = { parentId: PersonId; childId: PersonId };

// 夫婦リンク（順不同＝無向）
export type SpouseLink = { aId: PersonId; bId: PersonId };

type FamilyState = {
  people: Person[];
  edges: FamilyEdge[];
  spouses: SpouseLink[];
};

type FamilyActions = {
  addPerson: (p: { 
    name: string; 
    gender: Gender; 
    bloodType: BloodType; 
    birthDate: string;     // ★追加
    photoUri: string;     // ★追加
    note: string }) => void;

  updatePerson: (p: {
  id: PersonId;
  name: string;
  gender: Gender;
  bloodType: BloodType;
  birthDate: string;
  photoUri: string;
  note: string;
}) => void;
  removePerson: (id: PersonId) => void;

  addEdge: (parentId: PersonId, childId: PersonId) => void;
  removeEdge: (parentId: PersonId, childId: PersonId) => void;

  addSpouse: (aId: PersonId, bId: PersonId) => void;
  removeSpouse: (aId: PersonId, bId: PersonId) => void;

  resetAll: () => void;
};

type FamilyStore = FamilyState & FamilyActions;

const STORAGE_KEY = "familyTree.v2";

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function uniqEdges(edges: FamilyEdge[]) {
  const set = new Set<string>();
  const out: FamilyEdge[] = [];
  for (const e of edges) {
    const key = `${e.parentId}>>>${e.childId}`;
    if (!set.has(key)) {
      set.add(key);
      out.push(e);
    }
  }
  return out;
}

function normSpouseKey(aId: string, bId: string) {
  return [aId, bId].sort().join("<<<");
}

function uniqSpouses(spouses: SpouseLink[]) {
  const set = new Set<string>();
  const out: SpouseLink[] = [];
  for (const s of spouses) {
    if (!s.aId || !s.bId || s.aId === s.bId) continue;
    const key = normSpouseKey(s.aId, s.bId);
    if (!set.has(key)) {
      set.add(key);
      out.push(s);
    }
  }
  return out;
}

function getSpouseId(spouses: SpouseLink[], id: string): string | null {
  const link = spouses.find((s) => s.aId === id || s.bId === id);
  if (!link) return null;
  return link.aId === id ? link.bId : link.aId;
}

const FamilyContext = createContext<FamilyStore | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FamilyState>({ people: [], edges: [], spouses: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<FamilyState>;

          const peopleRaw = Array.isArray(parsed.people) ? parsed.people : [];
          const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
          const spousesRaw = Array.isArray(parsed.spouses) ? parsed.spouses : [];

          const normalizedPeople: Person[] = peopleRaw
            .map((p: any) => ({
              id: String(p.id),
              name: String(p.name ?? ""),
              gender:
                p.gender === "male" || p.gender === "female" || p.gender === "other"
                  ? p.gender
                  : "unknown",
              bloodType: p.bloodType === "A" || p.bloodType === "B" || p.bloodType === "AB" || p.bloodType === "O"
                ? p.bloodType
                : "unknown",
              birthDate: typeof p.birthDate === "string" ? p.birthDate : "",
              photoUri: typeof p.photoUri === "string" ? p.photoUri : "",
              note: typeof p.note === "string" ? p.note : "",
            }))
            .filter((p) => p.name.trim().length > 0);

          const normalizedSpouses: SpouseLink[] = spousesRaw
            .map((s: any) => ({ aId: String(s.aId), bId: String(s.bId) }))
            .filter((s) => s.aId && s.bId && s.aId !== s.bId);

          setState({
            people: normalizedPeople,
            edges,
            spouses: uniqSpouses(normalizedSpouses),
          });
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const store = useMemo<FamilyStore>(() => {
    return {
      ...state,
      
     addPerson: ({ name, gender, bloodType, birthDate, photoUri, note }) => {
  const trimmed = name.trim();
  if (!trimmed) return;

  setState((s) => ({
    ...s,
    people: [
      ...s.people,
      {
        id: makeId(),
        name: trimmed,
        gender,
        bloodType,
        birthDate: birthDate.trim(),
        photoUri: photoUri ?? "",
        note: note ?? "",
      },
    ],
  }));
},

updatePerson: ({ id, name, gender, bloodType, birthDate, photoUri, note }) => {
  const trimmed = name.trim();
  if (!trimmed) return;

  setState((s) => ({
    ...s,
    people: s.people.map((p) =>
      p.id === id
        ? {
            ...p,
            name: trimmed,
            gender,
            bloodType,
            birthDate: birthDate.trim(),
            photoUri: photoUri ?? "",
            note: note ?? "",
          }
        : p
    ),
  }));
},




      removePerson: (id) => {
        setState((s) => ({
          people: s.people.filter((p) => p.id !== id),
          edges: s.edges.filter((e) => e.parentId !== id && e.childId !== id),
          spouses: s.spouses.filter((sp) => sp.aId !== id && sp.bId !== id),
        }));
      },

      addEdge: (parentId, childId) => {
        if (!parentId || !childId) return;
        if (parentId === childId) return;

        setState((s) => {
          // 親2人まで（必要なら調整）
          const parentCount = s.edges.filter((e) => e.childId === childId).length;
          if (parentCount >= 2) return s;

          // 循環防止
          const childrenMap = buildChildrenMap(s.edges);
          if (reachable(childrenMap, childId, parentId)) return s;

          return { ...s, edges: uniqEdges([...s.edges, { parentId, childId }]) };
        });
      },

      removeEdge: (parentId, childId) => {
        setState((s) => ({
          ...s,
          edges: s.edges.filter((e) => !(e.parentId === parentId && e.childId === childId)),
        }));
      },

      addSpouse: (aId, bId) => {
        if (!aId || !bId) return;
        if (aId === bId) return;

        setState((s) => {
          // 1人1配偶者制（不要なら外せる）
          const aSp = getSpouseId(s.spouses, aId);
          const bSp = getSpouseId(s.spouses, bId);
          if (aSp || bSp) return s;

          return { ...s, spouses: uniqSpouses([...s.spouses, { aId, bId }]) };
        });
      },

      removeSpouse: (aId, bId) => {
        const key = normSpouseKey(aId, bId);
        setState((s) => ({
          ...s,
          spouses: s.spouses.filter((sp) => normSpouseKey(sp.aId, sp.bId) !== key),
        }));
      },

      resetAll: () => setState({ people: [], edges: [], spouses: [] }),
    };
  }, [state, loaded]);

  return <FamilyContext.Provider value={store}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used within FamilyProvider");
  return ctx;
}

export function buildChildrenMap(edges: FamilyEdge[]) {
  const map = new Map<PersonId, PersonId[]>();
  for (const e of edges) {
    const cur = map.get(e.parentId) ?? [];
    map.set(e.parentId, [...cur, e.childId]);
  }
  return map;
}

export function getSpouse(childrenSpouses: SpouseLink[], id: string) {
  return getSpouseId(childrenSpouses, id);
}

function reachable(childrenMap: Map<PersonId, PersonId[]>, from: PersonId, target: PersonId) {
  const q: PersonId[] = [from];
  const seen = new Set<PersonId>([from]);
  while (q.length) {
    const cur = q.shift()!;
    if (cur === target) return true;
    for (const n of childrenMap.get(cur) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        q.push(n);
      }
    }
  }
  return false;
}
