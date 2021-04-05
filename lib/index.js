'use strict'
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function(o, m, k, k2) {
				if (k2 === undefined) k2 = k
				Object.defineProperty(o, k2, {
					enumerable: true,
					get: function() {
						return m[k]
					},
				})
		  }
		: function(o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
		  })
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function(o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v })
		  }
		: function(o, v) {
				o['default'] = v
		  })
var __importStar =
	(this && this.__importStar) ||
	function(mod) {
		if (mod && mod.__esModule) return mod
		var result = {}
		if (mod != null)
			for (var k in mod)
				if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
					__createBinding(result, mod, k)
		__setModuleDefault(result, mod)
		return result
	}
var __importDefault =
	(this && this.__importDefault) ||
	function(mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, '__esModule', { value: true })
exports.clean = exports.cherryPick = void 0
const fs = __importStar(require('fs'))
const path_1 = require('path')
const util_1 = require('util')
const readPkgUp = require('read-pkg-up')
const tiny_glob_1 = __importDefault(require('tiny-glob'))
const mkDir = util_1.promisify(fs.mkdir)
const rimraf = util_1.promisify(require('rimraf'))
const stat = util_1.promisify(fs.stat)
const writeFile = util_1.promisify(fs.writeFile)
const isFile = path =>
	stat(path)
		.then(stats => stats.isFile())
		.catch(() => false)
const withDefaults = ({ cwd = '.', ...options }, additionalDefaults = {}) => ({
	inputDir: 'src',
	cwd: path_1.posix.resolve(process.cwd(), cwd),
	...additionalDefaults,
	...options,
})
const noop = () => {}
const findFiles = async ({ cwd, inputDir }) => {
	const filePaths = await tiny_glob_1.default(
		path_1.posix.join(inputDir, '!(index).{js,jsx,ts,tsx}'),
		{ cwd }
	)
	return filePaths
		.filter(f => !f.endsWith('.d.ts'))
		.map(filePath =>
			path_1.posix.basename(filePath).replace(/\.(js|ts)x?$/, '')
		)
}
const pkgCache = new WeakMap()
const getPkgName = async options => {
	if (options.name != null) {
		return options.name
	}
	if (pkgCache.has(options)) {
		return pkgCache.get(options)
	}
	const result = await readPkgUp({ cwd: options.cwd })
	if (!result) {
		throw new Error(
			'Could not determine package name. No `name` option was passed and no package.json was found relative to: ' +
				options.cwd
		)
	}
	const pkgName = result.pkg.name
	pkgCache.set(options, pkgName)
	return pkgName
}
const fileProxy = async (options, file) => {
	const { cwd, cjsDir, esmDir, typesDir } = options
	const pkgName = await getPkgName(options)
	const proxyPkg = {
		name: `${pkgName}/${file}`,
		private: true,
		main: path_1.posix.join('..', cjsDir, `${file}.js`),
		module: path_1.posix.join('..', esmDir, `${file}.js`),
	}
	if (typeof typesDir === 'string') {
		proxyPkg.types = path_1.posix.join('..', typesDir, `${file}.d.ts`)
	} else if (await isFile(path_1.posix.join(cwd, `${file}.d.ts`))) {
		proxyPkg.types = path_1.posix.join('..', `${file}.d.ts`)
		// try the esm path in case types are located with each
	} else if (await isFile(path_1.posix.join(cwd, esmDir, `${file}.d.ts`))) {
		proxyPkg.types = path_1.posix.join('..', esmDir, `${file}.d.ts`)
	}
	return JSON.stringify(proxyPkg, null, 2) + '\n'
}
const cherryPick = async inputOptions => {
	const options = withDefaults(inputOptions, {
		cjsDir: 'lib',
		esmDir: 'es',
	})
	const files = await findFiles(options)
	await Promise.all(
		files.map(async file => {
			const proxyDir = path_1.posix.join(options.cwd, file)
			await mkDir(proxyDir).catch(noop)
			await writeFile(
				`${proxyDir}/package.json`,
				await fileProxy(options, file)
			)
		})
	)
	return files
}
exports.cherryPick = cherryPick
const clean = async inputOptions => {
	const options = withDefaults(inputOptions)
	const files = await findFiles(options)
	await Promise.all(
		files.map(async file => rimraf(path_1.posix.join(options.cwd, file)))
	)
	return files
}
exports.clean = clean
//# sourceMappingURL=index.js.map
