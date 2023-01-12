import type { IClassModelType, IStateTreeNode, IType } from "./types";
export declare function getSnapshot<S>(value: IStateTreeNode<IType<any, S, any>> | IStateTreeNode<IClassModelType<any, any, S>>): S;
