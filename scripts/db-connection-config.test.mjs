import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";
import test from "node:test";

import { getConnectionConfig } from "./db-connection-config.mjs";

test("keeps the DNS hostname for TLS while connecting through IPv4", async () => {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const { port } = server.address();
    const config = await getConnectionConfig(
      `mysql://test-user:test-password@localhost:${port}/testdb?ssl-mode=REQUIRED`,
    );

    assert.equal(config.host, "localhost");
    assert.equal(config.ssl.servername, "localhost");
    assert.equal(typeof config.stream, "function");

    const socket = config.stream();
    try {
      await once(socket, "connect");
      assert.equal(net.isIPv4(socket.remoteAddress), true);
    } finally {
      socket.destroy();
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
