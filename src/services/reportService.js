// src/services/reportService.js
const storage = require('../storage');

/**
 * Servicio para generación y formateo de reportes
 */
const reportService = {
  /**
   * Formatea datos de reporte de timing en un mensaje estructurado
   * @param {Object} reportData - Datos del reporte organizados por grupo
   * @returns {string} Mensaje de reporte formateado con Markdown
   */
  formatTimingReport(reportData) {
    // Crear un array plano con todos los usuarios y su información de grupo
    const allUsers = [];
    const currentTime = Date.now();

    for (const [groupName, users] of Object.entries(reportData)) {
      users.forEach(user => {
        if (!user.error) {
          // Calcular tiempo desde última actualización
          const lastUpdate =
            storage.getLocationLastUpdate(user.groupId, user.userId) || 0;
          const timeSinceUpdate = Math.floor(
            (currentTime - lastUpdate) / (60 * 1000)
          ); // Convertir a minutos

          allUsers.push({
            ...user,
            groupName,
            timeSinceUpdate
          });
        }
      });
    }

    // Ordenar todos los usuarios por tiempo de llegada
    allUsers.sort((a, b) => a.durationMin - b.durationMin);

    // Crear el mensaje del reporte
    let reportMessage = '📍 *Reporte General de Timing*\n\n';

    // Agregar usuarios ordenados
    allUsers.forEach((user, index) => {
      const safeUserName = this.escapeMarkdown(user.userName);
      const safeGroupName = this.escapeMarkdown(user.groupName);

      let userReport =
        `${index + 1}. 🚚 *${safeGroupName}* - ${safeUserName}:\n` +
        `   - Dist: *${user.distanceKm}* km\n` +
        `   - ETA: *${user.durationMin}* minutos\n`;

      // Agregar información de última actualización solo si han pasado más de 5 minutos
      if (user.timeSinceUpdate >= 5) {
        userReport += `   - ultima act: ${user.timeSinceUpdate} min\n`;
      }

      reportMessage += userReport + '\n';
    });

    // Agregar usuarios con error al final
    const errorUsers = [];
    for (const [groupName, users] of Object.entries(reportData)) {
      users.forEach(user => {
        if (user.error) {
          errorUsers.push({
            ...user,
            groupName
          });
        }
      });
    }

    if (errorUsers.length > 0) {
      reportMessage += '\n❌ *Usuarios con error*:\n';
      errorUsers.forEach(user => {
        const safeUserName = this.escapeMarkdown(user.userName);
        const safeGroupName = this.escapeMarkdown(user.groupName);
        reportMessage += `- ${safeGroupName} - ${safeUserName}: ${user.error}\n`;
      });
    }

    return reportMessage;
  },

  /**
   * Formatea datos de reporte de geolocalización en un mensaje estructurado
   * @param {Object} reportData - Datos del reporte organizados por grupo
   * @returns {string} Mensaje de reporte formateado con Markdown
   */
  formatGeoReport(reportData) {
    let reportMessage = '📍 *Reporte General de Geo*\n\n';
    let index = 1;

    for (const [groupName, users] of Object.entries(reportData)) {
      users.forEach(user => {
        const safeUserName = this.escapeMarkdown(user.userName);
        const safeGroupName = this.escapeMarkdown(groupName);

        let userReport = `${index}. 🚚 *${safeGroupName}* - ${safeUserName}:\n`;
        userReport += `   - Lugar: col. ${user.location.colonia}, Mun ${user.location.municipio}\n`;

        // Agregar tiempo desde última actualización si es mayor a 5 minutos
        if (user.timeSinceUpdate >= 5) {
          userReport += `   - ultima act: ${user.timeSinceUpdate} min\n`;
        }

        reportMessage += userReport + '\n';
        index++;
      });
    }

    return reportMessage;
  },

  /**
   * Escapa caracteres especiales de Markdown
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado seguro para Markdown
   */
  escapeMarkdown(text) {
    if (!text) return '';
    // Escapa caracteres especiales de Markdown
    return text.replace(/([*_`[\]])/g, '\\$1');
  }
};

module.exports = reportService;
