import {db} from '@/lib/firebase-admin';
import {withTimeout} from '@/lib/timeout';
import {fail,json} from '@/lib/server';
export const runtime='nodejs';
export async function GET(){try{const settings=(await withTimeout(db().ref('settings/public').get())).val()||{};return json({merchantName:settings.merchantName||'',privacyPolicy:settings.privacyPolicy||'',offer:settings.offer||'',returnPolicy:settings.returnPolicy||'',contactEmail:settings.contactEmail||''})}catch(e){return fail(e,503)}}
