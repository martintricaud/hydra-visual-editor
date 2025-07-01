import { writable } from 'svelte/store';
import type { Obj } from '../types';

export const positions = writable<Obj>({}); 