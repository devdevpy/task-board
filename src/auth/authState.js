import { supabase } from '../lib/supabase.js';

let currentUser = null;
let listeners = [];

export function getUser() {
  return currentUser;
}

export function isAuthenticated() {
  return currentUser !== null;
}

export function onAuthChange(cb) {
  listeners.push(cb);
  cb(currentUser);
  return () => {
    listeners = listeners.filter((fn) => fn !== cb);
  };
}

function setUser(user) {
  currentUser = user;
  listeners.forEach((cb) => cb(user));
}

export async function initAuthState() {
  const { data } = await supabase.auth.getSession();
  setUser(data?.session?.user ?? null);

  supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user ?? null, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
