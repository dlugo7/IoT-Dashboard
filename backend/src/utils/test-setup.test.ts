describe('IoT Dashboard Backend', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should verify environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
}); 