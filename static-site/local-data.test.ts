import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Design} from '@/lib/types';

const mocks = vi.hoisted(() => ({
  user: {uid: 'owner-1'} as {uid: string} | null,
  set: vi.fn(), get: vi.fn(), remove: vi.fn(),
  legacyDesigns: vi.fn(), legacyAsset: vi.fn(), clearLegacyData: vi.fn(),
}));

vi.mock('./firebase', () => ({firebaseApp: {}, firebaseAuth: {get currentUser() {return mocks.user;}, authStateReady: async () => {}}}));
vi.mock('firebase/database', () => ({getDatabase: () => ({}), ref: (_db: unknown, path: string) => path, set: mocks.set, get: mocks.get, remove: mocks.remove}));
vi.mock('./legacy-data', () => ({legacyDesigns: mocks.legacyDesigns, legacyAsset: mocks.legacyAsset, clearLegacyData: mocks.clearLegacyData}));

const example: Design = {id:'project-1',ownerId:'untrusted',productId:'demo-tee',color:'Молочный',size:'M',title:'Тест',layers:[],isPublic:false,createdAt:1,updatedAt:2};
const snapshot = (value: unknown) => ({exists: () => value !== null, val: () => value});

describe('Firebase design storage', () => {
  beforeEach(() => {vi.resetModules(); vi.clearAllMocks(); mocks.user={uid:'owner-1'}; mocks.legacyDesigns.mockResolvedValue([]); mocks.get.mockResolvedValue(snapshot(null)); mocks.set.mockResolvedValue(undefined);});

  it('requires sign-in before saving', async () => {
    mocks.user=null;
    const {saveDesign, SignInRequiredError}=await import('./local-data');
    await expect(saveDesign(example)).rejects.toBeInstanceOf(SignInRequiredError);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it('writes the complete design only under the signed-in user', async () => {
    const {saveDesign}=await import('./local-data');
    const design={...example,layers:[{id:'layer-1',kind:'image' as const,areaId:'front',x:.2,y:.2,width:.3,height:.3,rotation:0,opacity:1,image:{assetId:'a',url:'data:image/webp;base64,AAAA',width:100,height:100,name:'photo.webp'}}]};
    await saveDesign(design);
    expect(mocks.set).toHaveBeenCalledWith('userDesigns/owner-1/project-1',expect.objectContaining({ownerId:'owner-1',layers:design.layers}));
  });

  it('reads only the current account path and ignores a mismatched owner', async () => {
    mocks.get.mockResolvedValueOnce(snapshot({...example,ownerId:'someone-else'}));
    const {loadDesign}=await import('./local-data');
    expect(await loadDesign('project-1')).toBeNull();
    expect(mocks.get).toHaveBeenCalledWith('userDesigns/owner-1/project-1');
  });

  it('rejects oversized projects before writing to the database', async () => {
    const {saveDesign}=await import('./local-data');
    await expect(saveDesign({...example,layers:[{id:'x',kind:'image',areaId:'front',x:0,y:0,width:1,height:1,rotation:0,opacity:1,image:{assetId:'a',url:'data:image/webp;base64,'+'A'.repeat(700_001),width:100,height:100,name:'large.webp'}}]})).rejects.toThrow('слишком большой');
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
