import { ImageSourcePropType } from "react-native";

export interface Categoria {
  id?: string;
  nome: string;
  cor: string;
  tipo: 'fixa' | 'variavel';
  userId: string;
  subcategorias?: Subcategoria[];
  imagem?: ImageSourcePropType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subcategoria {
  name: string;
  spent: number;
  limit: number;
}