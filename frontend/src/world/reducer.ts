//import { EntityActionType, EntityRegistry } from './types';
//import { setEntity, removeEntity, updateEntity } from './world';
import produce from "immer"
import {Reducer} from 'redux';
import {StoreAction} from "../store";
import {
  componentsReducer,
  getFilteredEntityIds,
  insertComponentsBulkMut,
  maxEntityId,
  newComponents,
  removeComponents,
  removeComponentsMut,
  setComponentsFromActionMut
} from './components/components';
import {EntityComponent} from "./components/entity";
import {SetAction} from "./components/types";
import {EntityActionType, EntityId, World} from './types';


const newWorld = (): World => ({
  nextId: 0,
  components: newComponents(),
})

export const world: Reducer<World, StoreAction> = (state, action) => {
  /*
    this reducer intercepts entity actions which require modification of across components,
    passing on the rest to a bundle of component-specific reducers
  */


  if (state === undefined){
    return newWorld();
  }
  if (action.type===EntityActionType.add){
    console.log(action)
  }
  switch(action.type){
    case EntityActionType.add:
      return produce(state, (proxy: World) => {
        const newId = proxy.nextId;
        proxy.nextId = proxy.nextId + 1;
        let setAction: SetAction = produce(action, (action: any) => {
          action.type = EntityActionType.set;
          action.payload["entityId"] = newId;
        }) as any;
        console.log(action)
        proxy.components = setComponentsFromActionMut(proxy.components, newId, setAction);
      })
    case EntityActionType.selectAdd:
      return produce(state,(proxy:World)=>{
        proxy.components.entity.forEach(f=>{
          if (f.entityId === action.payload.entityId) {
            f.selected=true
          }
        })

      })
    case EntityActionType.selectRemove:
      return produce(state,(proxy:World)=>{
        proxy.components.entity.forEach((f,key)=>{
          if (f.entityId === action.payload.entityId) {
            f.selected=false
          }
        })
      })
    case EntityActionType.set:
      return produce(state, (proxy: World) => {
        proxy.nextId = Math.max(action.payload.entityId + 1, proxy.nextId);
        proxy.components = setComponentsFromActionMut(proxy.components, action.payload.entityId, action);
      })

    case EntityActionType.setAll:
      return produce(state, (proxy: World) => {
        proxy.nextId = maxEntityId(action.payload.components) + 1;
        proxy.components = insertComponentsBulkMut(newComponents(), action.payload.components);

      })
    case EntityActionType.remove:

      return produce(state, (proxy: World) => {
        proxy.components = removeComponents(proxy.components, action.payload.entityId);
      })
    // for more cases, should generalize selection via entityId to some (serializable) filter function
    case EntityActionType.removeAllTargets:
        const targetIds = getFilteredEntityIds(state.components, (e: EntityComponent) => e.entityType === "Target");
        return produce(state, (proxy: World) => {
          targetIds.forEach((v: EntityId) => {
            removeComponentsMut(proxy.components, v)
          })
        });
    default:
      return produce(state, (proxy: World) => {
        proxy.components = componentsReducer(proxy.components, action);
      });
  }
}
