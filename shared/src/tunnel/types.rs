use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "authenticationMethod")]
pub enum SSHTunnelAuthenticationMethod {
  Password {
    password: String,
  },
  PublicKey {
    #[serde(rename = "privateKey")]
    private_key: String,
    passphrase: Option<String>,
  },
  Agent,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SSHTunnelConfiguration {
  pub host: String,
  pub port: String,
  pub username: String,
  #[serde(flatten)]
  pub authentication: SSHTunnelAuthenticationMethod,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SSHConnectionTarget {
  #[serde(rename = "remoteHost")]
  pub remote_host: String,
  #[serde(rename = "remotePort")]
  pub remote_port: String,
}

pub struct SSHTunnelConnection {
  pub local_port: u32,
}
