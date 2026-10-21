import {describe, expect, it} from 'vitest';
import {validLayerBounds} from './bounds';
import type {Layer} from './types';
const layer: Layer = {id:'x',kind:'image',areaId:'front',x:.3,y:.3,width:.4,height:.4,rotation:0,opacity:1};
describe('print area bounds',()=>{
 it('accepts centered and rotated layers that fit',()=>{expect(validLayerBounds(layer)).toBe(true);expect(validLayerBounds({...layer,rotation:45})).toBe(true)});
 it('rejects a layer when rotation crosses the edge',()=>expect(validLayerBounds({...layer,x:0,rotation:45})).toBe(false));
});
