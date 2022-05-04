import { IStateTreeNode, IType } from "./types";
export declare function getSnapshot<S>(value: IStateTreeNode<IType<any, S, any>>): S;
