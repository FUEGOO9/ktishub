import { Product } from "../types";
import productsData from "../../data/products.json";

export const INITIAL_PRODUCTS = productsData as unknown as Product[];
