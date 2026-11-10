// Raw content import of a CSS file (Vite/Vitest), used by the tests.
declare module "*.css?raw" {
	const content: string;
	export default content;
}
