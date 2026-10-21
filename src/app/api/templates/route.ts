import {db} from '@/lib/firebase-admin';
import {fail,json} from '@/lib/server';
import {withTimeout} from '@/lib/timeout';
import type {DesignTemplate} from '@/lib/types';
export const runtime='nodejs';
export async function GET(){try{const snap=await withTimeout(db().ref('designTemplates').get());return json({items:(Object.values(snap.val()||{}) as DesignTemplate[]).filter(t=>t.published)});}catch(e){return fail(e,503)}}
