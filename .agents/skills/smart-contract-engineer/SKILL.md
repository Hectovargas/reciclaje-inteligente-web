---
name: smart-contract-engineer
description: >-
  Implementa y testea smart contracts ERC-20 según las especificaciones del Blockchain Architect.
  Utilizar cuando se requiera escribir código Solidity, configurar contratos en packages/contracts,
  y crear suites completas de pruebas unitarias e integración con Hardhat o Foundry.
---

# Smart Contract Engineer Skill

Esta habilidad guía la implementación en Solidity y testing automatizado de contratos inteligentes ERC-20 en `packages/contracts` para el proyecto **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Implementar contratos inteligentes seguros, eficientes en consumo de gas y exhaustivamente probados utilizando **OpenZeppelin Contracts** y **Hardhat / Foundry**.

### ⛔ Límites Estrictos
- **Implementa el contrato y escribe tests unitarios completos.**
- **NO realiza despliegues directos a redes públicas o mainnets.**
- **NO modifica la lógica del backend ni de la base de datos.**

---

## 🛠️ Requisitos Técnicos del Contrato

1. **Estándar ERC-20**:
   - Heredar de OpenZeppelin (`ERC20`, `ERC20Burnable`, `Pausable`, `AccessControl` u `Ownable`).
   - Símbolo: `RECI`, Nombre: `Reciclaje Inteligente Token`.
2. **Emisión Restringida (*Restricted Minting*)**:
   - Función `mint(address to, uint256 amount)` restringida exclusivamente al rol `MINTER_ROLE` / `onlyOwner`.
   - Función `mintBatch(address[] calldata recipients, uint256[] calldata amounts)` con validación de arrays de igual longitud y control de desbordamiento de gas.
3. **Eventos**:
   - Emitir eventos claros para auditoría (`TokensMinted`, `BatchMintExecuted`).

---

## 🧪 Pruebas Unitarias Obligatorias (`packages/contracts/test`)

Antes de considerar el contrato listo, se deben ejecutar y aprobar tests unitarios que verifiquen:

- [ ] **Control de Acceso**: Revertir llamadas a `mint` o `mintBatch` si el emisor no tiene permisos de operador/admin.
- [ ] **Validación de Parámetros**: Revertir `mintBatch` si los arrays de direcciones y montos tienen longitudes dispares o direcciones cero (`address(0)`).
- [ ] **Balances y Eventos**: Confirmar incremento exacto en el balance de cada destinatario y emisión correcta de eventos.
- [ ] **Pausabilidad**: Revertir transferencias y emisiones cuando el contrato se encuentre en estado pausado.

---

## 🔄 Flujo de Trabajo

1. **Revisión del Spec**: Consultar la especificación técnica provista por el `blockchain-architect`.
2. **Implementación**: Escribir el contrato en `packages/contracts/contracts/`.
3. **Compilación**: Ejecutar `pnpm hardhat compile` o `forge build` y verificar que no existan advertencias ni errores del compilador.
4. **Testing**: Ejecutar suite de pruebas con `pnpm hardhat test` o `forge test` asegurando >95% de cobertura de líneas y ramas.
5. **Reporte de Gas**: Revisar reporte de gas de `hardhat-gas-reporter` para optimizar `mintBatch`.
