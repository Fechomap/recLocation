// src/storage/index.js
/**
 * Almacenamiento centralizado para la aplicación
 * Reemplaza las variables globales del código original
 */
class Storage {
  constructor() {
    // Inicializar objetos de almacenamiento
    this.reset();
  }
  
  /**
   * Reinicia todos los datos almacenados
   */
  reset() {
    // Mapeo de chats grupales { chatId: nombreGrupo }
    this.groupChats = {};
    
    // Ubicaciones de usuarios { chatId: { userId: { latitude, longitude } } }
    this.userLocations = {};
    
    // Nombres de usuarios { userId: userName }
    this.userNames = {};
    
    // Timestamps de última actualización de ubicación { chatId: { userId: timestamp } }
    this.locationLastUpdate = {};
  }
  
  // Métodos para chats grupales
  setGroupChat(chatId, name) {
    this.groupChats[chatId] = name;
    return this;
  }
  
  getGroupChat(chatId) {
    return this.groupChats[chatId];
  }
  
  getAllGroupChats() {
    return this.groupChats;
  }
  
  // Métodos para ubicación de usuarios
  setUserLocation(chatId, userId, location) {
    if (!this.userLocations[chatId]) {
      this.userLocations[chatId] = {};
    }
    this.userLocations[chatId][userId] = location;
    
    // Actualizar timestamp
    if (!this.locationLastUpdate[chatId]) {
      this.locationLastUpdate[chatId] = {};
    }
    this.locationLastUpdate[chatId][userId] = Date.now();
    
    return this;
  }
  
  getUserLocation(chatId, userId) {
    return this.userLocations[chatId]?.[userId];
  }
  
  getAllUserLocations() {
    return this.userLocations;
  }
  
  // Métodos para nombres de usuario
  setUserName(userId, name) {
    this.userNames[userId] = name;
    return this;
  }
  
  getUserName(userId) {
    return this.userNames[userId] || `Usuario ${userId}`;
  }
  
  getAllUserNames() {
    return this.userNames;
  }
  
  getAllUserNames() {
    return this.userNames;
  }
  
  // Métodos para timestamps de última actualización
  getLocationLastUpdate(chatId, userId) {
    return this.locationLastUpdate[chatId]?.[userId] || 0;
  }
  
  getAllLocationLastUpdates() {
    return this.locationLastUpdate;
  }
}

// Exportar una instancia singleton
module.exports = new Storage();