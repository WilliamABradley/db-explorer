use crate::errors::*;
use crate::io::tunnel::{SSHTunnelMessage, SSHTunnelMessagePayload};
use crate::io::*;
use crate::tunnel::{SSHTunnel, SSHTunnelInterface};
use crate::utils::*;
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use std::collections::HashMap;
use std::sync::Arc;

lazy_static! {
  static ref INSTANCES: Mutex<HashMap<u32, Arc<Mutex<SSHTunnel>>>> = Mutex::new(HashMap::new());
}

async fn get_tunnel(id: &u32) -> Result<Arc<Mutex<SSHTunnel>>, DriverError> {
  let instances = INSTANCES.lock().await;
  if !instances.contains_key(id) {
    return Result::Err(DriverError::NoConnectionError(*id));
  }
  let instance = &instances[id];
  return Result::Ok(instance.clone());
}

pub async fn handle_tunnel_message(message: &SSHTunnelMessagePayload) -> OutboundMessage {
  let message_data = &message.data;

  // Instance-less methods.
  match message_data {
    SSHTunnelMessage::Create(configuration) => {
      let tunnel = SSHTunnel {
        configuration: configuration.clone(),
        session: Mutex::new(None),
      };
      let mut instances = INSTANCES.lock().await;
      let id = instances.keys().len() as u32;
      instances.insert(id, Arc::new(Mutex::new(tunnel)));
      return as_result(id);
    }
    SSHTunnelMessage::Flush => {
      let mut instances = INSTANCES.lock().await;
      let key_count = instances.keys().len() as u32;
      for index in 0..key_count {
        let id = index + 1;
        {
          let mut inst = instances[&id].lock().await;
          let _ = inst.close().await;
        }
        instances.remove(&id);
      }
      return as_result(());
    }
    _ => (),
  };

  if message.id.is_none() {
    panic!("Instance id not provided!");
  }

  // Retrieve the instance.
  let instance_id = message.id.unwrap();
  let instance_result = get_tunnel(&instance_id).await;
  if instance_result.is_err() {
    return as_error(instance_result.err().unwrap());
  }
  let instance_mutex = instance_result.unwrap();
  let instance = instance_mutex.lock().await;

  // Handle instance methods.
  match message_data {
    SSHTunnelMessage::Connect(target) => {
      let result = instance.connect(target).await;
      if result.is_err() {
        return as_error(result.err().unwrap());
      }
    }
    SSHTunnelMessage::Close => {
      let result = instance.close().await;
      if result.is_err() {
        return as_error(result.err().unwrap());
      }
    }
    _ => (),
  }

  return as_result(());
}
